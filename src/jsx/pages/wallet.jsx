import React from "react";
import Layout from "../layout/layout";
import profile2 from "../../images/profile/2.png";
import { Link } from "react-router-dom";

const Wallet = () => {
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
                    src={profile2}
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
                  <div className="align-content-center">
                    <Link to={"#"}>
                      <span className="verified">
                        <i className="icofont-check-alt"></i>
                      </span>
                      Connected
                    </Link>
                  </div>
                  <div>
                    <Link to={"#"} className="btn btn-primary">
                      Disconnect
                    </Link>
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
                  Earn free bitcoins in rewards by completing a learning mission
                  daily or inviting friends to Qash.
                  <Link to={"#"}>Learn more</Link>
                </p>
              </div>
              <div className="bottom-area border-top align-content-center">
                <div className="card-body d-flex justify-content-between">
                  <div className="align-content-center">
                    <Link to={"#"}>
                      <span className="not-verified">
                        <i className="icofont-close-line"></i>
                      </span>
                      Desconnected
                    </Link>
                  </div>
                  <div>
                    <Link to={"#"} className="btn btn-primary">
                      Connect
                    </Link>
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
