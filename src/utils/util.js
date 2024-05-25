import * as CBOR from "cbor-js";

export function strToBuffer(hexString) {
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

export function bufferToStr(buffer) {
    return Array.from(buffer).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

export function cborDecode(value) {
    const data = strToBuffer(value);
    return CBOR.decode(data.buffer);
}

export function cborEncodeV2(amount) {
    const data = CBOR.encode(amount);
    return bufferToStr(data);
}

export function cborEncode(CardanoWasm, amount) {
    if (Array.isArray(amount)) { // format [ada, assets]
        const [ada, assets] = amount;
        return CardanoWasm.Value.from_json(JSON.stringify({
            coin: Number(ada).toString(),
            multiasset: Object.entries(assets).reduce((dict, [policy_id, tokens]) => ({ ...dict, [policy_id]: Object.entries(tokens).reduce((d, [asset_name, quantity]) => ({ ...d, [asset_name]: quantity.toString() }), {}) }), {})
        })).to_hex();
    } else {
        return CardanoWasm.Value.new(toBigNum(CardanoWasm, amount)).to_hex();
    }
}

export function getSignersUtxos(CardanoWasm, utxos) {
    const signers = new Set();
    for (const utxo of utxos) {
        const addr = CardanoWasm.TransactionUnspentOutput.from_hex(utxo)
            .output()
            .address();
        const key = getAddressPaymentKeyHash(CardanoWasm, addr);
        if (key && !signers.has(key)) {
            signers.add(key);
        }
    }
    return signers;
}

export function getSignersCollateral(CardanoWasm, _tx, collateralCandidates) {
    const signers = new Set();
    const tx = CardanoWasm.Transaction.from_hex(_tx);
    const collaterals = tx.body().collateral();
    const candidates = collateralCandidates.reduce((map, c) => {
        const utxo = CardanoWasm.TransactionUnspentOutput.from_hex(c);
        const input = utxo.input();
        const addr = getAddressPaymentKeyHash(CardanoWasm, utxo.output().address());
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

export function rebuildTx(CardanoWasm, pTx, signature, neededVKeys = null) {
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

export function getAddressPaymentKeyHash(CardanoWasm, address) {
    try {
        const addr = typeof address == 'string' ? CardanoWasm.Address.from_bech32(address) : address;
        const baseAddr = CardanoWasm.BaseAddress.from_address(addr) || CardanoWasm.EnterpriseAddress.from_address(addr);
        return baseAddr?.payment_cred()?.to_keyhash()?.to_hex();
    } catch (err) {
        return undefined;
    }
}

export function getAddress(CardanoWasm, hex) {
    return CardanoWasm.Address.from_bytes(
        fromHex(hex)
    ).to_bech32()
}

export const fromHex = (hex) => Buffer?.from(hex, "hex");

export function toBigNum(Cardano, quantity) {
    return Cardano.BigNum.from_str(quantity.toString());
}

const LOVELACE = 1_000_000;

export function toLovelace(amount) {
    return amount * LOVELACE;
}

export function toAda(amount) {
    return amount / LOVELACE;
}

export const onFiletSelected = (e, cb) => {
    const file = e.target.files[0];
    var reader = new FileReader();
    reader.addEventListener('load', function (e) {
        cb(e.target.result);
    });

    reader.readAsText(file);
}

export const downloadJsonFile = (data, fileName) => {
    // create file in browser
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    // create "a" HTLM element with href to file
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
}