import React, {useState} from 'react';
import { Check } from 'lucide-react';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { wallets } from '../../../utils/wallets';

export default function CardanoWallet() {

  const { cardano } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [ selectedWallet, setSelectedWallet ] = useState("");


  const onSelectWallet = async (wallet) => {
    const newWalletState = await cardano.setWallet(wallet);
    dispatch({ type: 'UPDATE_CARDANO_WALLET', payload: newWalletState });
    closeDrawer();
}

  const supportedWallets = (wallets) => {
    if (typeof window.cardano === 'undefined') {
      return [];
    }
    const supportedWallets = wallets.filter(w => window.cardano[w.code]).map(w => ({ code: w.code, icon: w.icon, ...window.cardano[w.code] }));
    // supportedWalletsRef.current = supportedWallets;
    return supportedWallets;
  }

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  
  
  return (
    <div className="d-flex flex-column w-100 h-100 p-3">      
        <div className="drawer-header">
          <div className="d-flex justify-content-start">                  
            <button
              className="btn btn-close align-content-center px-1 mt-2 position-absolute"
              onClick={closeDrawer}
              aria-label="close"
            >                        
            </button>
            <h4            
              className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold"
            >
              Cardano Wallet
            </h4>
          </div>          
        </div>      
        <div className="drawer-body">
          <div style={{ display: 'flex', 'flexDirection': 'column' }}>
              {supportedWallets(wallets).map((w, i) => {
                  return (
                    <div key={i} className={"card card-button"+(selectedWallet.code === w.code ? " selected" : "")+( cardano.wallet ? (cardano.wallet.code === w.code ? " connected" : "") : ("") )}>
                                 
                      <div className="card-body top-area d-flex" onClick={() => setSelectedWallet(w)}>
                        <div className="d-flex align-items-center">
                          <img
                            className="mr-3 rounded-circle wallet-circle mr-0 mr-sm-3"
                            src={w.icon}
                            width="60"
                            height="60"
                            alt=""
                          /> 
                          <div className="media-body">
                            <h4 className="mb-0">{w.code}</h4>
                          </div>
                        </div>
                      </div>
                      <div className="bottom-area border-top align-content-center">
                        <div className="card-body d-flex justify-content-between">
                          <div className="align-content-center wallet-status">
                            <span className="verified">
                              <Check size={14} />
                            </span>
                            { cardano.wallet && ( w.icon === cardano.wallet.icon && "Connected" )}
                          </div>
                          <div></div>                  
                        </div>
                      </div>              
                    </div>
                  )
              })}
            </div>
        </div>
        { selectedWallet.code ? (
            cardano.wallet ? (
              cardano.wallet.code === selectedWallet.code ? (
                <div className='drawer-footer d-flex flex-column'>
                  <button className="btn btn-danger" onClick={() => onSelectWallet(null)}>
                    Disconnect
                  </button>
                </div>  
              ) : (
                <div className='drawer-footer d-flex flex-column'>
                  <button className="btn btn-gradient" onClick={() => { onSelectWallet(selectedWallet); }}>
                    Connect
                  </button>
                </div>
              )         
            ) : (
              <div className='drawer-footer d-flex flex-column'>
                  <button className="btn btn-gradient" onClick={() => onSelectWallet(selectedWallet)}>
                    Connect
                  </button>
                </div>
            )
          ) : (
          <div className='drawer-footer d-flex flex-column'>
            <button className="btn btn-non">
              Select Wallet
            </button>
          </div>
        )}
    </div>
  );
}
