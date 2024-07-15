
import { useCallback, useMemo, useState } from "react";
import { Lucid } from "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js"
import { cborDecode, getStakeAddress } from "../../../utils/util";

function useCardano({ network, provider }) {
    const [wallet, setCurrentWallet] = useState(null);

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
            const stake_address = getStakeAddress(address);
            const newWalletState = { ...wallet, provider: lucidWallet, utils: lucid.utils, api, balance, address, stake_address };
            setCurrentWallet(newWalletState);
            return newWalletState;
        } catch (e) {
            console.log('setWallet error:', e);
        }
    }, []);
    
    
    const value = useMemo(() => ({
        wallet,
        setWallet,
    }), [wallet, setWallet]);
    return value;

}

export default useCardano;