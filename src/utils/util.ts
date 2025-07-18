import { Lucid, applyParamsToScript, applyDoubleCborEncoding, Data, SpendingValidator, MintingPolicy, toHex, fromText, UTxO, TxSigned, TxComplete, C, M, SignedMessage } from "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js"
import * as CBOR from "cbor-js";
import blueprint from "./plutus.json";
import { AppliedValidators, Policy, Mint, Credential, MintRedeemer, DatumMetadata, ClaimRedeemer, SigStructure, CoseSignature, Signatures } from "./types";

export function strToBuffer(hexString: string) {
    // ensure even number of characters
    if (hexString.length % 2 != 0) {

    }

    // check for some non-hex characters
    var bad = hexString.match(/[G-Z\s]/i);
    if (bad) {
        throw new Error('ERROR: found non-hex characters');
    }

    // split the string into pairs of octets
    var pairs = hexString.match(/[\dA-F]{2}/gi);

    if (!pairs) {
        throw new Error("ERROR: invalid hex pairs");
    }
    // convert the octets to integers
    var integers = pairs.map(function (s) {
        return parseInt(s, 16);
    });

    return new Uint8Array(integers);
}

export function bufferToStr(buffer: any) {
    return Array.from(buffer).map((byte: any) => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

export function cborDecode(value: string) {
    const data = strToBuffer(value);
    return CBOR.decode(data.buffer);
}

export function cborEncodeV2(amount: any) {
    const data = CBOR.encode(amount);
    return bufferToStr(data);
}

export function cborEncode(CardanoWasm: any, amount: any) {
    if (Array.isArray(amount)) { // format [ada, assets]
        const [ada, assets] = amount;
        return CardanoWasm.Value.from_json(JSON.stringify({
            coin: Number(ada).toString(),
            multiasset: Object.entries<any>(assets).reduce((dict, [policy_id, tokens]) => ({ ...dict, [policy_id]: Object.entries<any>(tokens).reduce((d, [asset_name, quantity]) => ({ ...d, [asset_name]: quantity.toString() }), {}) }), {})
        })).to_hex();
    } else {
        return CardanoWasm.Value.new(toBigNum(CardanoWasm, amount)).to_hex();
    }
}

export function getSignersUtxos(CardanoWasm: any, utxos: any[]) {
    const signers = new Set();
    for (const utxo of utxos) {
        const addr = CardanoWasm.TransactionUnspentOutput.from_hex(utxo)
            .output()
            .address();
        const key = getAddressPaymentKeyHash(addr);
        if (key && !signers.has(key)) {
            signers.add(key);
        }
    }
    return signers;
}

export function getSignersCollateral(CardanoWasm: any, _tx: string, collateralCandidates: any[]) {
    const signers = new Set();
    const tx = CardanoWasm.Transaction.from_hex(_tx);
    const collaterals = tx.body().collateral();
    const candidates = collateralCandidates.reduce((map, c) => {
        const utxo = CardanoWasm.TransactionUnspentOutput.from_hex(c);
        const input = utxo.input();
        const addr = getAddressPaymentKeyHash(utxo.output().address());
        const id = `${input.transaction_id().to_hex()}#${input.index()}`;
        map.set(id, addr);
        return map;
    }, new Map());
    if (collaterals) {
        for (let i = 0; i < collaterals.len(); i++) {
            const input = collaterals.get(i);
            const id = `${input.transaction_id().to_hex()}#${input.index()}`;
            if (candidates.has(id)) {
                signers.add(candidates.get(id));
            }
        }
    }
    return signers;
}

export function rebuildTx(CardanoWasm: any, pTx: string, signature: string, neededVKeys: any = null) {
    const { Transaction, TransactionWitnessSet, Vkeywitnesses } = CardanoWasm;

    const partialTx = Transaction.from_hex(pTx);
    const witnessSet = TransactionWitnessSet.from_bytes(Buffer.from(signature, 'hex'));

    const txBody = partialTx.body();
    const data = partialTx.auxiliary_data();
    const witnesses = partialTx.witness_set();

    const plutusData = witnesses.plutus_data();
    const nativeScripts = witnesses.native_scripts();
    const currentkeys = witnesses.vkeys();

    const newKeys = witnessSet.vkeys();

    const vkeyWitnesses = Vkeywitnesses.new();
    const currentKeyHashes = new Set();

    // add previous witnesses keys coming from the sale, e.g policy script keys
    if (currentkeys) {
        for (let i = 0; i < currentkeys.len(); i++) {
            const key = currentkeys.get(i);
            const keyHash = key.vkey().public_key().hash().to_hex();
            if (!currentKeyHashes.has(keyHash)) {
                vkeyWitnesses.add(key);
                currentKeyHashes.add(keyHash);
            }
        }
    }

    // add new witnesses keys
    if (newKeys) {
        for (let i = 0; i < newKeys.len(); i++) {
            const key = newKeys.get(i);
            const keyHash = key.vkey().public_key().hash().to_hex();
            if ((!neededVKeys || neededVKeys.has(keyHash)) && !currentKeyHashes.has(keyHash)) {
                vkeyWitnesses.add(key);
                currentKeyHashes.add(keyHash);
            }
        }
    }

    if (vkeyWitnesses.len() > 0) {
        witnesses.set_vkeys(vkeyWitnesses);
    }
    if (nativeScripts && nativeScripts.len() > 0) {
        witnesses.set_native_scripts(nativeScripts);
    }

    if (plutusData && plutusData.len() > 0) {
        witnesses.set_plutus_data(plutusData);
    }

    const tx = Transaction.new(txBody, witnesses, data);
    return Buffer.from(tx.to_bytes()).toString('hex');
}

export function getAddress(CardanoWasm: any, hex: string) {
    return CardanoWasm.Address.from_bytes(
        fromHex(hex)
    ).to_bech32()
}

export const fromHex = (hex: string) => Buffer?.from(hex, "hex");

export function toBigNum(Cardano: any, quantity: number) {
    return Cardano.BigNum.from_str(quantity.toString());
}

const LOVELACE = 1_000_000;

export function toLovelace(amount: number) {
    return amount * LOVELACE;
}

export function toAda(amount: number) {
    return amount / LOVELACE;
}


export const readValidators = () => {
    const redeem = blueprint.validators.find((v) => v.title === "soulbound.redeem");

    if (!redeem) {
        throw new Error("Redeem validator not found");
    }

    const mint = blueprint.validators.find((v) => v.title === "soulbound.mint");

    if (!mint) {
        throw new Error("Mint validator not found");
    }

    return {
        redeem: {
            type: "PlutusV2",
            script: redeem.compiledCode,
        },
        mint: {
            type: "PlutusV2",
            script: mint.compiledCode,
        },
    };
}

export const buildPolicy = (type: string, args: { signers: string[] }) => {
    // TODO: build differnt policy based on type arg
    switch (type) {
        case 'all':
            const policy: Policy = {
                type: 'All',
                scripts: args.signers.map(keyHash => ({
                    type: 'Sig',
                    keyHash: keyHash,
                    slot: null,
                    require: null
                })),
                keyHash: null,
                slot: null,
                require: null,
            };
            return policy;
        default:
            throw new Error(`Invalid type: ${type}`);
    }
}


export const generateRandomNonce = (length = 32) => {
    const array = new Uint8Array(length / 2);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
};

export function hashPolicy(policy: Policy): string {
    const cborData = Data.to(policy, Policy);
    return toHex(C.hash_blake2b256(fromHex(cborData)));
}

export const buildCollectionContracts = (mint_script: string, redeem_script: string, utils: Lucid.Utils, policy: Policy, nonce?: string): AppliedValidators => {
    const redeem: SpendingValidator = {
        type: "PlutusV2",
        script: applyDoubleCborEncoding(redeem_script)
    };
    const smartContract = utils.validatorToAddress(redeem);
    const scriptHash = utils.validatorToScriptHash(redeem);
    const credential: Credential = { ScriptCredential: [scriptHash] };

    const mintParams = Data.from(Data.to({
        policy: policy,
        script: credential,
        nonce: nonce || generateRandomNonce()
    }, Mint));

    const mint: MintingPolicy = {
        type: "PlutusV2",
        script: applyDoubleCborEncoding(applyParamsToScript(mint_script,
            [
                mintParams
            ]
        ))
    };

    const policyId = utils.validatorToScriptHash(mint);
    const policyHash = hashPolicy(policy);

    return {
        mint,
        redeem,
        policyId,
        policyHash,
        smartContract
    };
}


export const mintToken = async (tokenName: string, metadata: any, policyId: string, policyHash: string, beneficiary: string, signatures: {[key: string]: string}, smartContract: string, mint: MintingPolicy, utxo: UTxO, lucid: Lucid): Promise<{ txComplete: TxComplete, mintUtxo: UTxO }> => {
    const lovelace = 1_000_000;
    const assetName = `${policyId}${fromText(tokenName)}`;
    const msg = fromText("Issued");
    console.log('Signatures', signatures);
    
    const _signatures: Signatures = new Map(
        Object.entries(signatures).map(([key, s]) => [key, Data.from(s, CoseSignature)])
    )
    const minter: MintRedeemer = { Mint: { msg, signatures: _signatures } };
    const mintRedeemer = Data.to(minter, MintRedeemer);
    console.log('Redeemer:', mintRedeemer);

    const data = Data.fromJson({
        [policyId]: {
            [tokenName]: {
                name: tokenName,
                ...metadata
            }
        }
    })

    const d: DatumMetadata = {
        policyId: policyHash,
        beneficiary,
        status: msg,
        metadata: {
            data,
            version: BigInt(1),
            extra: null
        }
    }

    const datum = Data.to(d, DatumMetadata);
    // console.log('Datum', datum);
    const validTo = Date.now() + (60 * 60 * 1000); // 1 hour
    const tx = await lucid
        .newTx()
        .collectFrom([utxo])
        // use the mint validator
        .attachMintingPolicy(mint)
        // mint 1 of the asset
        .mintAssets(
            { [assetName]: BigInt(1) },
            // this redeemer is the first argument
            mintRedeemer
        )
        .payToContract(
            smartContract,
            {
                inline: datum,
            },
            {
                lovelace: BigInt(lovelace),
                [assetName]: BigInt(1)
            }
        )
        // .addSignerKey(signerKey)
        .validTo(validTo)
        .complete();
    const txComplete = await tx.sign();
    const lovelaceOut = findLockedLovelace(smartContract, txComplete.txComplete.body().outputs());
    const mintUtxo: UTxO = {
        txCbor: txComplete.toString(),
        txHash: txComplete.toHash(),
        address: smartContract,
        outputIndex: 0,
        assets: { lovelace: lovelaceOut, [assetName]: Number(1) },
        datum
    }
    return { txComplete, mintUtxo };
    // console.log('Tx Id:', txHash);
    // const success = await lucid.awaitTx(txHash);
    // console.log('Success?', success);
}

export const claimToken = async (tokenName: string, metadata: any, policyId: string, policyHash: string, beneficiary: string, smartContract: string, redeem: SpendingValidator, tokenUtxo: UTxO, utxo: UTxO, lucid: Lucid): Promise<{ txSigned: TxSigned, claimUtxo: UTxO }> => {
    const lovelace = 1_000_000;
    const assetName = `${policyId}${fromText(tokenName)}`;
    const msg = fromText("Claimed");

    const data = Data.fromJson({
        [policyId]: {
            [tokenName]: {
                name: tokenName,
                ...metadata
            }
        }
    });

    const d: DatumMetadata = {
        policyId: policyHash,
        beneficiary,
        status: msg,
        metadata: {
            data,
            version: BigInt(1),
            extra: null
        }
    }

    const datum = Data.to(d, DatumMetadata);
    // console.log('Datum', datum);
    const claimer: ClaimRedeemer = "ClaimToken";
    const claimRedeemer = Data.to(claimer, ClaimRedeemer);

    const validTo = Date.now() + (60 * 60 * 1000); // 1 hour

    const tx = await lucid
        .newTx()
        .collectFrom([utxo, tokenUtxo], claimRedeemer)
        .addSignerKey(beneficiary)
        // consume script
        .attachSpendingValidator(redeem)
        .payToContract(
            smartContract,
            {
                inline: datum,
            },
            {
                lovelace: BigInt(lovelace),
                [assetName]: BigInt(1)
            }
        )
        .validTo(validTo)
        .complete();
    const txSigned = await tx.sign().complete();
    const lovelaceOut = findLockedLovelace(smartContract, txSigned.txSigned.body().outputs());
    const claimUtxo: UTxO = {
        address: smartContract,
        txHash: txSigned.toHash(),
        outputIndex: 0,
        assets: { lovelace: lovelaceOut, [assetName]: Number(1) },
        datum
    }
    return { txSigned, claimUtxo };
}

export const burnToken = async (tokenName: string, policy: Policy, policyId: string, signatures: {[key: string]: string}, mint: MintingPolicy, redeem: SpendingValidator, tokenUtxo: UTxO, utxo: UTxO, lucid: Lucid): Promise<TxSigned> => {
    const assetName = `${policyId}${fromText(tokenName)}`;

    const _signatures: Signatures = new Map(
        Object.entries(signatures).map(([key, s]) => [key, Data.from(s, CoseSignature)])
    )
    const minter: MintRedeemer = "Burn";
    const mintRedeemer = Data.to(minter, MintRedeemer);
    const claimer: ClaimRedeemer = { BurnToken: { policy, signatures: _signatures } };
    const claimRedeemer = Data.to(claimer, ClaimRedeemer);

    const validTo = Date.now() + (60 * 60 * 1000); // 1 hour
    const tx = await lucid
        .newTx()
        .collectFrom([utxo, tokenUtxo], claimRedeemer)
        // use the mint validator
        .attachMintingPolicy(mint)
        // burn 1 of the asset
        .mintAssets(
            { [assetName]: BigInt(-1) },
            // this redeemer is the first argument
            mintRedeemer
        )
        .attachSpendingValidator(redeem)
        // .addSignerKey(signerKey)
        .validTo(validTo)
        .complete();
    const txSigned = await tx.sign().complete();
    return txSigned;
}

export const findLockedLovelace = (smartContract: string, outputs: C.TransactionOutputs): number | undefined => {
    const length = outputs.len();
    for (let i = 0; i < length; i++) {
        const output = outputs.get(i);
        const address = output.address();
        try {
            const bech32Addr = address.to_bech32();
            if (bech32Addr === smartContract) {
                const lovelace = output.amount().coin().to_str();
                return Number(lovelace);
            }
        } catch (error) {

        }
    }
    return undefined;
}


export const getStakeAddress = (address: string): string | null => {
    try {
        const addr = C.Address.from_bech32(address);
        const baseAddr = C.BaseAddress.from_address(addr);
        let stakeAddr = null;
        if (baseAddr) {
            const stakeCredential = baseAddr.stake_cred();
            const reward = C.RewardAddress.new(addr.network_id(), stakeCredential);
            stakeAddr = reward.to_address().to_bech32();
        }
        return stakeAddr;
    } catch (err) {
        console.log('Error (getStakeAddress):', err);
        
        return null;
    }
}


export const getAddressPaymentKeyHash = (address: string | C.Address | any): string | null => {
    try {
        const addr = typeof address === 'string' ? C.Address.from_bech32(address) : address;
        const baseAddr = C.BaseAddress.from_address(addr) || C.EnterpriseAddress.from_address(addr);
        return baseAddr?.payment_cred()?.to_keyhash().to_hex();
    } catch (err) {
        console.log('Error (getAddressPaymentKeyHash):', err);
        
        return null;
    }
}


export const getSigningMessage = (policyHash: string): string => {
    return fromText("SIGN|") + policyHash;
}

export const buildSignature = (addr: string, message: string, signedMessage: SignedMessage): string => {
    const cose = M.COSESign1.from_bytes(fromHex(signedMessage.signature));
    const key = M.COSEKey.from_bytes(fromHex(signedMessage.key));
    const pubKey = C.PublicKey.from_bytes(
        key.header(M.Label.new_int(
            M.Int.new_negative(
                M.BigNum.from_str("2"),
            ),
        ))?.as_bytes()!,
    )
    const signature = C.Ed25519Signature.from_bytes(cose.signature()).to_hex();
  
    const sigStruct: SigStructure = {
        context: fromText("Signature1"),
        body_protected: toHex(cose.headers().protected().deserialized_headers().to_bytes()),
        sign_protected: null,
        external_aad: "",
        payload: message
    };
  
    const coseSig: CoseSignature = {
        key: toHex(pubKey.as_bytes()),
        address: addr,
        sig_structure: sigStruct,
        signature: signature
    };
    return Data.to(coseSig, CoseSignature);
  }