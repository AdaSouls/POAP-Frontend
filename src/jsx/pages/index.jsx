import { Link } from "react-router-dom";
import bannerWelcome from "../../images/banner/banner-welcome.jpg";
import adaSolusLogoBanner from "../../images/banner/adasouls-logo-banner.png";
import Layout from "../layout/layout";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import {
  useDrawer
} from "../contexts/drawer/drawer.provider";

const indicators = (index) => <div className="indicator">{index + 1}</div>;

const Dashboard = () => {
  const {
    cardano: { wallet },
    ethereum: { provider },
  } = useDrawer();
  const images = [bannerWelcome, bannerWelcome];

  return (
    <Layout activeMenu={1}>
      <div className="row">
        {/* USER STATE CARD */}
        <div className="col-xxl-3 col-xl-4 col-lg-4">
          <div className="card welcome-profile card-classic">
            <div className="card-body card-classic-max-height">
              <h4>
                Welcome to<br></br>
                <span>AdaSouls</span>
              </h4>
              <br></br>
              <p>
                We are a multichain platform. Connect your Cardano wallet to
                interact with SOUL and your Ethereum wallet to interact with
                POAP.
              </p>
              <ul>
                <li>
                  {wallet ? (
                    <span className="verified">
                      <i className="icofont-check-alt"></i>
                    </span>
                  ) : (
                    <span className="not-verified">
                      <i className="icofont-close-line"></i>
                    </span>
                  )}
                  Cardano Wallet
                  {/* <Link to={"#"}> */}
                  {/* </Link> */}
                </li>
                <li>
                  {provider ? (
                    <span className="verified">
                      <i className="icofont-check-alt"></i>
                    </span>
                  ) : (
                    <span className="not-verified">
                      <i className="icofont-close-line"></i>
                    </span>
                  )}
                  Ethereum Wallet
                  {/* <Link to={"#"}> */}
                  {/* </Link> */}
                </li>
              </ul>
            </div>
            <div className="m-3">
              <Link
                className="btn btn-gradient btn-block btn-small mt-1"
                to={"/wallet"}
              >
                Wallets
              </Link>
            </div>
          </div>
        </div>
        {/* BANNER CARD */}
        <div className="col-xxl-9 col-xl-8 col-lg-8">
          <div className="card card-classic">
            <div className="card-banner">
              <Slide indicators={indicators} scale={1.4}>
                <div className="each-slide-effect">
                  <div style={{ backgroundImage: `url(${images[0]})` }}>
                    <span>
                      <img src={adaSolusLogoBanner}></img>
                      <p>
                        <strong>AdaSouls</strong> is the first open platform to
                        create <strong>Soulbound Tokens</strong> and{" "}
                        <strong>POAPs</strong> in <strong>Cardano</strong>
                      </p>
                    </span>
                  </div>
                </div>
                <div className="each-slide-effect">
                  <div style={{ backgroundImage: `url(${images[1]})` }}>
                    <span>
                      <img src={adaSolusLogoBanner}></img>
                      <p>
                        <strong>AdaSouls</strong> is the first open platform to
                        create <strong>Soulbound Tokens</strong> and{" "}
                        <strong>POAPs</strong> in <strong>Cardano</strong>
                      </p>
                    </span>
                  </div>
                </div>
              </Slide>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
