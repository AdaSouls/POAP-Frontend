import React from 'react';
import { Link } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { wallets } from '../../../utils/wallets';
import eternlWallet from "../../../images/wallets/eternl.jpg";
import { Button } from 'react-bootstrap';

export default function CardanoWallet() {

  const { cardano } = useDrawer();
  const dispatch = useDrawerDispatch();


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
          { cardano.wallet && (
            <div className="card card-small">
              <div className="card-wallet">
                <div className="card-body top-area d-flex">
                  <div className="d-flex align-items-center">
                    <img
                      className="mr-3 rounded-circle mr-0 mr-sm-3"
                      src={cardano.wallet.icon}
                      width="75"
                      height="75"
                      alt=""
                    />
                    <div className="media-body">
                      <h4 className="mb-0">{cardano.wallet.code}</h4>
                      {/* <p className="mb-0">Text</p> */}
                    </div>
                  </div>
                </div>
                <div className="bottom-area border-top align-content-center">
                  <div className="card-body d-flex justify-content-between">
                    <div className="align-content-center wallet-status">
                      <span className="verified">
                        <i className="icofont-check-alt"></i>
                      </span>
                      Connected
                    </div>
                    <div></div>                  
                  </div>
                </div>
              </div>
             </div>
          )}
          <div style={{ display: 'flex', 'flexDirection': 'column' }}>
              {supportedWallets(wallets).map(w => {
                  return (
                      <Button variant="dark" className='mb-2' key={w.code} onClick={() => onSelectWallet(w)}>
                          {w.code}
                      </Button>
                  )
              })}
            </div>
        </div>
        { cardano.wallet && (
          <div className='drawer-footer d-flex flex-column'>
            <Button variant="danger" onClick={() => onSelectWallet(null)}>
              Disconnect
            </Button>
          </div>
        )}
    </div>
  );
}
