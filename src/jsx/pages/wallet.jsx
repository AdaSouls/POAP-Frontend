import React from "react";
import { Check, X } from "lucide-react";
import Layout from "../layout/layout";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import PoapCollection from "../components/poapCollection";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 10)}…${hex.slice(-6)}`;
};

const Wallet = () => {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();

  const showMidnightWallet = () => {
    dispatch({ type: "SHOW_MIDNIGHT_WALLET" });
  };

  return (
    <Layout activeMenu={5}>
      <div className="inner-header">
        <div className="inner-header-row">
          <div className="inner-header-row-left">
            <h4>Wallet</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-6 col-xl-6 col-lg-12">
          <div className="card card-outline-only">
            <div className="card-wallet">
              {midnight.provider ? (
                <>
                  <div className="card-body top-area d-flex">
                    <div className="d-flex align-items-center">
                      <div className="media-body">
                        <h4 className="mb-0">Lace</h4>
                        <p className="mb-0 text-muted small text-break">
                          {truncateHex(midnight.provider.address)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bottom-area border-top align-content-center">
                    <div className="card-body d-flex justify-content-between">
                      <div className="align-content-center wallet-status">
                        <span className="verified">
                          <Check size={14} />
                        </span>
                        Connected
                      </div>
                      <div>
                        <button className="btn btn-danger btn-small" onClick={showMidnightWallet}>
                          Change Wallet
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
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
                          <X size={14} />
                        </span>
                        Disconnected
                      </div>
                      <div>
                        <button className="btn btn-gradient btn-small" onClick={showMidnightWallet}>
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

      {midnight.provider && (
        <div className="row">
          <div className="col-xxl-8 col-xl-8 col-lg-7 col-md-7">
            <PoapCollection />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Wallet;
