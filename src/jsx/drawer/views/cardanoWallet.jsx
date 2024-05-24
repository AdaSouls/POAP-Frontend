import React from 'react';
import { Link } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import eternlWallet from "../../../images/wallets/eternl.jpg";

export default function CardanoWallet() {

  const state = useDrawer();
  const dispatch = useDrawerDispatch();

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
          <div className="card card-small">
            <div className="card-wallet">
              <div className="card-body top-area d-flex">
                <div className="d-flex align-items-center">
                  <img
                    className="mr-3 rounded-circle mr-0 mr-sm-3"
                    src={eternlWallet}
                    width="75"
                    height="75"
                    alt=""
                  />
                  <div className="media-body">
                    <h4 className="mb-0">Eternl Wallet</h4>
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
        </div>
        <div className='drawer-footer'>
          <Link to={"#"} className="btn btn-danger btn-block">
            Disconnect
          </Link>
        </div>
    </div>
  );
}
