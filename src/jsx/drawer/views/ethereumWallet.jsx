import React from 'react';
import { useState } from 'react';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import {getEthereumWallet} from '../../../utils/ethWallets';
import underConstruct from "../../../images/construct.png";

export default function EthereumWallet() {

  const { ethereum } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [ selectedWallet, setSelectedWallet ] = useState("");

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  

  const onSelectWallet = async (provider, wallet) => {
    const newWalletState = await ethereum.setProvider(provider, wallet);
    dispatch({ type: 'UPDATE_ETHEREUM_WALLET', payload: newWalletState });
    closeDrawer();
  }
  
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
              Connect Wallet
            </h4>
          </div>          
        </div>      
        <div className="drawer-body">
        <div className="row d-flex justify-content-center under-construct">
        
        <img
        className="align-content-center m-0"
        src={underConstruct}
        alt=""
        />
        <h5 className="align-content-center m-0">Section under construction</h5>
      
    </div>   
          {/* <div style={{ display: 'flex', 'flexDirection': 'column' }}>
              {ethWallets.map(w => {
                  return (
                    <div className={"card card-button"+(selectedWallet == w ? " selected" : "")+( ethereum.provider ? (ethereum.provider.wallet == w ? " connected" : "") : ("") )}>
                      <div className="card-body top-area d-flex" onClick={() => setSelectedWallet(w)}>
                        <div className="d-flex align-items-center">
                          <img
                            className="mr-3 rounded-circle wallet-circle mr-0 mr-sm-3"
                            src={w.img}
                            width="60"
                            height="60"
                            alt=""
                          /> 
                          <div className="media-body">
                            <h4 className="mb-0">{w.name}</h4>
                          </div>
                        </div>
                      </div>
                      <div className="bottom-area border-top align-content-center">
                        <div className="card-body d-flex justify-content-between">
                          <div className="align-content-center wallet-status">
                            <span className="verified">
                              <i className="icofont-check-alt"></i>
                            </span>
                            { ethereum.provider && ( w == ethereum.provider.wallet && "Connected" )}
                          </div>
                          <div></div>                  
                        </div>
                      </div>              
                    </div>
                  )
              })}
            </div> */}
        </div>
        {/* { selectedWallet ? (
            ethereum.provider ? (
              ethereum.provider.wallet == selectedWallet ? (
                <div className='drawer-footer d-flex flex-column'>
                  <button className="btn btn-danger" onClick={() => onSelectWallet(null)}>
                    Disconnect
                  </button>
                </div>  
              ) : (
                <div className='drawer-footer d-flex flex-column'>
                  <button className="btn btn-gradient" onClick={() => { onSelectWallet(getEthereumWallet(selectedWallet), selectedWallet); }}>
                    Connect
                  </button>
                </div>
              )       
            ) : (
              <div className='drawer-footer d-flex flex-column'>
                  <button className="btn btn-gradient" onClick={() => { onSelectWallet(getEthereumWallet(selectedWallet), selectedWallet); }}>
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
        )} */}
        
    </div>
  );
}
