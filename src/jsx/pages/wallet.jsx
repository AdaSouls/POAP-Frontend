import React, { useEffect } from "react";
import Layout from "../layout/layout";
import eternlWallet from "../../images/wallets/eternl.jpg";
import { Link } from "react-router-dom";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import PoapCollection from "../components/poapCollection";
import PoapIssuerDetails from "../components/poapIssuerDetails";

const Wallet = () => {
  const { cardano, ethereum, poapEvents, poapCollection } = useDrawer();
  const dispatch = useDrawerDispatch();

  const showCardanoWallet = () => {
    dispatch({
      type: "SHOW_CARDANO_WALLET",
    });
  };

  const showEthereumWallet = () => {
    dispatch({
      type: "SHOW_ETHEREUM_WALLET",
    });
  };

  return (
    <Layout activeMenu={5}>
      <div className="row">
        <div className="col-xxl-6 col-xl-6 col-lg-12">
          <div className="card card-small">
            <div className="card-wallet">
              {cardano.wallet && (
                <>
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
                          Change Wallet
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!cardano.wallet && (
                <>
                  <div className="card-body top-area d-flex">
                    <p className="align-content-center m-0">
                      Required to interact with SOUL
                    </p>
                  </div>
                  <div className="bottom-area border-top align-content-center">
                    <div className="card-body d-flex justify-content-between">
                      <div className="align-content-center wallet-status">
                        <span className="not-verified">
                          <i className="icofont-close-line"></i>
                        </span>
                        Disconnected
                      </div>
                      <div>
                        <button
                          className="btn btn-gradient btn-small"
                          onClick={showCardanoWallet}
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="col-xxl-6 col-xl-6 col-lg-12">
          <div className="card card-small">
            <div className="card-wallet">
              {ethereum.provider && (
                <>
                  <div className="card-body top-area d-flex">
                    <div className="d-flex align-items-center">
                      <img
                        className="mr-3 rounded-circle mr-0 mr-sm-3"
                        src={ethereum.provider.wallet.img}
                        width="75"
                        height="75"
                        alt=""
                      />
                      <div className="media-body">
                        <h4 className="mb-0 text-capitalize">
                          {ethereum.provider.wallet.name}
                        </h4>
                      </div>
                    </div>
                  </div>
                  {ethereum.provider.chainId == 200101 ? (
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
                            onClick={showEthereumWallet}
                          >
                            Change Wallet
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bottom-area border-top align-content-center">
                      <div className="card-body d-flex justify-content-between">
                        <div className="align-content-center wallet-status">
                          <span className="alert-verified">
                            <i className="icofont-exclamation"></i>
                          </span>
                          Connected - Change chain ID
                        </div>
                        <div>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={showEthereumWallet}
                          >
                            Change Chain
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!ethereum.provider && (
                <>
                  <div className="card-body top-area d-flex">
                    <p className="align-content-center m-0">
                      Required to interact with POAP
                    </p>
                  </div>
                  <div className="bottom-area border-top align-content-center">
                    <div className="card-body d-flex justify-content-between">
                      <div className="align-content-center wallet-status">
                        <span className="not-verified">
                          <i className="icofont-close-line"></i>
                        </span>
                        Disconnected
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {ethereum.provider && (
        // This elements should have a gap between them of 20px
        <div className="row">
          <div className="col-xxl-4 col-xl-4 col-lg-5 col-md-5">
            <PoapIssuerDetails />
          </div>
          <div className="col-xxl-8 col-xl-8 col-lg-7 col-md-7">
            <PoapCollection />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Wallet;
