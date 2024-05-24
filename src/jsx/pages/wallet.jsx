import React from "react";
import Layout from "../layout/layout";
import eternlWallet from "../../images/wallets/eternl.jpg";
import { Link } from "react-router-dom";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";

const Wallet = () => {

  const state = useDrawer();
  const dispatch = useDrawerDispatch();

  const showCardanoWallet = () => {
    dispatch({
      type: 'SHOW_CARDANO_WALLET'
    });
  };  

  const showEthereumWallet = () => {
    dispatch({
      type: 'SHOW_ETHEREUM_WALLET'
    });
  };  

  return (
    <Layout activeMenu={4}>
      <div className="row">
        <div className="col-xxl-6 col-xl-6 col-lg-12">
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
                  <div>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={showCardanoWallet}
                    >
                      Disconnect
                    </button>
                  </div>                  
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-6 col-xl-6 col-lg-12">
          <div className="card card-small">
            <div className="card-wallet">
              <div className="card-body top-area d-flex">
                <p className="align-content-center m-0">
                  Necessary to operate with POAP
                </p>
              </div>
              <div className="bottom-area border-top align-content-center">
                <div className="card-body d-flex justify-content-between">
                  <div className="align-content-center wallet-status">                    
                      <span className="not-verified">
                        <i className="icofont-close-line"></i>
                      </span>
                      Desconnected                    
                  </div>
                  <div>
                    <button
                      className="btn btn-gradient btn-small"
                      onClick={showEthereumWallet}
                    >
                      Connect
                    </button>
                  </div>                  
                </div>
              </div>
            </div>
          </div>
        </div>       
      </div>  
      
    </Layout>
  );
};

export default Wallet;
