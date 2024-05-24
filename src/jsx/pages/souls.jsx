import React from "react";
import { Link } from "react-router-dom";
import eternlWallet from "../../images/wallets/eternl.jpg";
import threeDots from "../../icons/svg/three-dots.svg";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";

const Souls = () => { 

  const state = useDrawer();
  const dispatch = useDrawerDispatch();

  const createPoap = () => {
    dispatch({
      type: 'CREATE_POAP'
    });
  };  

  const createSoul = () => {
    dispatch({
      type: 'CREATE_SOUL'
    });
  };  

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
    <Layout activeMenu={3}>
      <div className="row">

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-create bg-soulbound card-classic">
            <div
              className="card-body card-classic-max-height"
              onClick={createSoul}
            >
              <h4>CREATE<span> SOULBOUND</span></h4>               
              <div className="plus-button align-content-center" >
                <div></div><div></div>
              </div>              
            </div>
            <div className="d-flex justify-content-between m-3">
              <div className="align-content-center mt-4">                    
                <span className="verified">
                  <i className="icofont-check-alt"></i>
                </span>                
              </div>
              <div className="align-content-center mt-4">
                <Link to={"#"} className="btn btn-secondary btn-small btn-negative">
                    Disconnect
                </Link>
              </div> 
            </div>
          </div>
        </div>

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">??????</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    <tr>
                      <td className="table-image">                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                      < Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">??????</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    <tr>
                      <td className="table-image">                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                      < Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">??????</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    <tr>
                      <td className="table-image">                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                      < Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>


        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-create bg-poap card-classic">
            <div
              className="card-body card-classic-max-height"
              onClick={createPoap}
            >
              <h4>CREATE<span> POAP</span></h4>               
              <div className="plus-button align-content-center">
                <div></div><div></div>
              </div>              
            </div>
            <div className="d-flex justify-content-between m-3">
              <div className="align-content-center mt-4">                    
                <span className="not-verified">
                  <i className="icofont-close-line"></i>
                </span>                
              </div>
              <div className="align-content-center mt-4">
                <Link to={"#"} className="btn btn-secondary btn-small btn-negative">
                    Connect
                </Link>
              </div> 
            </div>
          </div>
        </div>

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">??????</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    <tr>
                      <td className="table-image">                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                      < Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">??????</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    <tr>
                      <td className="table-image">                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                      < Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">??????</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    <tr>
                      <td className="table-image">                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                      < Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        

      </div>
    </Layout>
  );
};

export default Souls;
