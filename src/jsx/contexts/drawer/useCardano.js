
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lucid } from "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js"
import Cardano from "../../../utils/serialization";
import { cborDecode, cborEncode, rebuildTx, toLovelace } from "../../../utils/util";

function useCardano({ network, provider }) {
    const [wallet, setCurrentWallet] = useState(null);
    const cardanoRef = useRef(null);

    const setWallet = useCallback(async (wallet) => {
        try {
            if (!wallet) {
                setCurrentWallet(null);
                return Promise.resolve(null);
            }
            const api = await wallet.enable();

            // get balance
            const balance = cborDecode(await api.getBalance());

            // get wallet 
            // const hex = await api.getChangeAddress();
            // const address = getAddress(cardanoRef.current, hex);

            const lucid = await Lucid.new(provider, network);
            const lucidWallet = lucid.selectWallet(api);
            const address = await lucid.wallet.address();
            const newWalletState = { ...wallet, provider: lucidWallet, utils: lucid.utils, api, balance, address };
            setCurrentWallet(newWalletState);
            return newWalletState;
        } catch (e) {
            console.log('setWallet error:', e);
        }
    }, []);

    const signTx = useCallback(async (tx, partial = true) => {
        const signature = await wallet.api.signTx(tx, partial);
        return rebuildTx(cardanoRef.current, tx, signature)
    }, [wallet]);

    const createScript = useCallback(async (label, network, signers) => {
        try {
            // TODO use Lucid to generate script
        } catch (error) {
            return null
        }
    }, [wallet]);

    const getCollateral = async (wallet) => {
        const amount = toLovelace(10);
        const api = wallet.api.getCollateral ? wallet.api : wallet.api.experimental;
        console.log('Collateral amount to ask:', cborEncode(cardanoRef.current, amount));
        const collaterals = await api.getCollateral(cborEncode(cardanoRef.current, amount));
        return collaterals;
    };
    
    async function loadCardano() {
        await Cardano.load();
        const instance = Cardano.instance;
        cardanoRef.current = instance;
    }
    
    useEffect(() => {
        loadCardano();
    }, []);
    
    const value = useMemo(() => ({
        wallet,
        setWallet,
        signTx,
        createScript
    }), [wallet, setWallet, signTx, createScript]);
    return value;

}

export default useCardano;