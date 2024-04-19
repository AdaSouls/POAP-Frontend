import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PerfectScrollbar from "react-perfect-scrollbar";
import AreaChart from "../charts/area";
import DonutChart from "../charts/donut";
import PriceArea from "../charts/price-area";
import bannerWelcome from "../../images/banner/banner-welcome.jpg";
import adaSolusLogoBanner from "../../images/banner/adasouls-logo-banner.png";
import qrImg from "../../images/qr.svg";
import Layout from "../layout/layout";
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';

const indicators = (index) => (<div className="indicator">{index + 1}</div>);

const CardLibrary = () => {

  const images = [
    bannerWelcome,
    bannerWelcome,
  ];

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show2, setShow2] = useState(false);
  const handleClose2 = () => setShow2(false);
  const handleShow2 = () => {
    setShow(false);
    setShow2(true);
  };
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/verify-step-2");
  };

  return (
    <Layout activeMenu={10}>
      <div className="row">
        <div className="col-xxl-6 col-xl-6 col-lg-12">
          <div className="card">
            <div className="card-body">
              <div className="invite-content">
                <h4>Invite a friend and get $30</h4>
                <p>
                  You will receive up to $30 when they： 1.Buy Crypto 2. Deposit
                  3. Finish Trading Tasks <br />
                  <Link to={"#"}>Learn more</Link>
                </p>

                <div className="copy-link">
                  <form action="#">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value="https://www.Qash.io/join/12345"
                      />
                      <span className="input-group-text">Copy</span>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-6 col-xl-6 col-lg-12">
          <div className="card">
            <div className="card-body">
              <div className="invite-content">
                <h4>Get free BTC every day</h4>
                <p>
                  Earn free bitcoins in rewards by completing a learning mission
                  daily or inviting friends to Qash.{" "}
                  <Link to={"#"}>Learn more</Link>
                </p>

                <Link to={"#"} className="btn btn-primary">
                  Invite friends to join
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-4 col-xl-4 col-lg-6">
          <div className="price-widget position-relative bg-btc">
            <Link to={"/price-details"}>
              <div className="price-content">
                <div className="icon-title">
                  <i className="cc BTC-alt"></i>
                  <span>Bitcoin</span>
                </div>
                <h5>$ 11,785.10</h5>
              </div>
              <PriceArea />
            </Link>
          </div>
        </div>
        <div className="col-xxl-4 col-xl-4 col-lg-6">
          <div className="price-widget position-relative bg-eth">
            <Link to={"/price-details"}>
              <div className="price-content">
                <div className="icon-title">
                  <i className="cc ETH-alt"></i>
                  <span>Ethereum</span>
                </div>
                <h5>$ 11,785.10</h5>
              </div>
              <PriceArea />
            </Link>
          </div>
        </div>
        <div className="col-xxl-4 col-xl-4 col-lg-6">
          <div className="price-widget position-relative bg-usdt">
            <Link to={"/price-details"}>
              <div className="price-content">
                <div className="icon-title">
                  <i className="cc USDT-alt"></i>
                  <span>Tether</span>
                </div>
                <h5>$ 11,785.10</h5>
              </div>
              <PriceArea />
            </Link>
          </div>
        </div>
        {/* USER STATE CARD */}
        <div className="col-xxl-3 col-xl-6 col-lg-6">
          <div className="card welcome-profile card-height-400">
            <div className="card-body card-body-max-height-320">
              <h4>Welcome to<br></br><span>AdaSouls</span></h4>
              <ul>
                <li>
                  <Link to={"#"}>
                    <span className="verified">
                      <i className="icofont-check-alt"></i>
                    </span>
                    Cardano Wallet
                  </Link>
                </li>
                <li>
                  <Link to={"#"}>
                    <span className="not-verified">
                      <i className="icofont-close-line"></i>
                    </span>
                    Ethereum Wallet
                  </Link>
                </li>
                <li>
                  <Link to={"#"}>
                    <span className="not-verified">
                      <i className="icofont-close-line"></i>
                    </span>
                    Role
                  </Link>
                </li>
              </ul>
            </div>
            <div className="card-button">
              <Link to={"#"} className="btn btn-gradient btn-block btn-bottom">
                  Wallets
              </Link>
            </div>
          </div>
        </div>
        {/* FAQS CARD */}
        <div className="col-xxl-3 col-xl-6 col-lg-6">
          <div className="card card-height-400">
          
            <div className="card-header">
              <h4 className="card-title">FAQ´s </h4>
            </div>
            <div className="card-body card-body-max-height-260">
              <h4>Hola</h4>
              <p>Texto de FAQs para redirigir a la pagina adecuada</p>      
            </div>
            <div className="card-button">
              <Link to={"#"} className="btn btn-secondary btn-block btn-bottom">
                  Go to FAQ's
              </Link>
            </div>
          </div>
        </div>
        {/* BANNER CARD */}
        <div className="col-xxl-6">
          <div className="card card-height-400">
            <div className="card-banner">
              <Slide indicators={indicators} scale={1.4}>
                <div className="each-slide-effect">
                    <div style={{ 'backgroundImage': `url(${images[0]})` }}>                        
                        <span>
                          <img src={adaSolusLogoBanner}></img>
                          <p><strong>AdaSouls</strong> is the first open platform to create <strong>Soulbound Tokens</strong> and <strong>POAPs</strong> in <strong>Cardano</strong></p>
                        </span>
                    </div>
                </div>
                <div className="each-slide-effect">
                    <div style={{ 'backgroundImage': `url(${images[1]})` }}>
                        <span>
                          <img src={adaSolusLogoBanner}></img>
                          <p><strong>AdaSouls</strong> is the first open platform to create <strong>Soulbound Tokens</strong> and <strong>POAPs</strong> in <strong>Cardano</strong></p>
                        </span>
                    </div>
                </div>
              </Slide>
            </div>  
          </div>
        </div>
      </div>
      {/* CURRENCY */}
      <div className="row">  
        <div className="col-xxl-3 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Buy </h4>
            </div>
            <div className="card-body">
              <form
                method="post"
                name="myform"
                className="currency_validate trade-form row g-3"
              >
                <div className="col-12">
                  <label className="form-label">Send</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">USD</option>
                      <option value="master">Euro</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Receive</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">BTC</option>
                      <option value="master">ETH</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <p className="mb-0">
                  1 USD ~ 0.000088 BTC
                  <Link to={"#"}>
                    Expected rate <br />
                    No extra fees
                  </Link>
                </p>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={handleShow}
                >
                  Buy Now
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* CURRENCY */}
        <div className="col-xxl-3 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Sell </h4>
            </div>
            <div className="card-body">
              <form
                method="post"
                name="myform"
                className="currency_validate trade-form row g-3"
              >
                <div className="col-12">
                  <label className="form-label">Send</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">USD</option>
                      <option value="master">Euro</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Receive</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">BTC</option>
                      <option value="master">ETH</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <p className="mb-0">
                  1 USD ~ 0.000088 BTC{" "}
                  <Link to={"#"}>
                    Expected rate <br />
                    No extra fees
                  </Link>
                </p>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={handleShow}
                >
                  Sell Now
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* CURRENCY */}
        <div className="col-xxl-3 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Transfer </h4>
            </div>
            <div className="card-body">
              <form
                name="myform"
                className="currency_validate trade-form row g-3"
              >
                <div className="col-12">
                  <label className="form-label">Send</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">USD</option>
                      <option value="master">Euro</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Receive</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">BTC</option>
                      <option value="master">ETH</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <p className="mb-0">
                  1 USD ~ 0.000088 BTC{" "}
                  <Link to={"#"}>
                    Expected rate <br />
                    No extra fees
                  </Link>
                </p>

                <button
                  type="button"
                  className="btn btn-success btn-block"
                  onClick={handleShow}
                >
                  Transfer Now
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* CURRENCY */}
        <div className="col-xxl-3 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Convert </h4>
            </div>
            <div className="card-body">
              <form
                method="post"
                name="myform"
                className="currency_validate trade-form row g-3"
              >
                <div className="col-12">
                  <label className="form-label">From</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">USD</option>
                      <option value="master">Euro</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">To</label>
                  <div className="input-group">
                    <select className="form-control" name="method">
                      <option value="bank">BTC</option>
                      <option value="master">ETH</option>
                    </select>
                    <input
                      type="text"
                      name="currency_amount"
                      className="form-control"
                      placeholder="0.0214 BTC"
                    />
                  </div>
                </div>

                <p className="mb-0">
                  1 USD ~ 0.000088 BTC{" "}
                  <Link to={"#"}>
                    Expected rate <br />
                    No extra fees
                  </Link>
                </p>

                <button
                  type="button"
                  className="btn btn-success btn-block"
                  onClick={handleShow}
                >
                  Convert Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="row">        
        <div className="col-xxl-8 col-xl-8">
          <div className="card home-chart">
            <div className="card-header">
              <h4 className="card-title home-chart">Analytics</h4>
              <select
                className="form-select"
                name="report-type"
                id="report-select"
              >
                <option value="1">Bitcoin</option>
                <option value="2">Litecoin</option>
              </select>
            </div>
            <div className="card-body">
              <div className=" home-chart-height">
                <AreaChart />
                <div className="row">
                  <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6">
                    <div className="chart-price-value">
                      <span>24hr Volume</span>
                      <h5>$236,368.00</h5>
                    </div>
                  </div>
                  <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6">
                    <div className="chart-price-value">
                      <span>Marketcap</span>
                      <h5>$236.025B USD</h5>
                    </div>
                  </div>
                  <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6">
                    <div className="chart-price-value">
                      <span>24hr Volume</span>
                      <h5>56.3 BTC</h5>
                    </div>
                  </div>
                  <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6">
                    <div className="chart-price-value">
                      <span>All Time High</span>
                      <h5>$236,368.00</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-4 col-xl-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Trade Balances</h4>
            </div>
            <div className="card-body">
              <PerfectScrollbar className="balance-widget trade-balance">
                <li>
                  <h5>Trade Balance</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>Total margin currency balance.</span>
                  </div>
                </li>
                <li>
                  <h5>Equity</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>
                      Trade balance combined with unrealized profit/loss
                    </span>
                  </div>
                </li>
                <li>
                  <h5>Used Margin</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>Total margin amount used in open positions.</span>
                  </div>
                </li>
                <li>
                  <h5>Free Margin</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>Usable margin balance. Equal to equity minus.</span>
                  </div>
                </li>
                <li>
                  <h5>Margin Level</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>Percentage ratio of equity to used margin.</span>
                  </div>
                </li>
              </PerfectScrollbar>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-4 col-xl-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Position Valuation</h4>
            </div>
            <div className="card-body">
              <PerfectScrollbar className="balance-widget position-value">
                <li>
                  <h5>Opening Cost</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>Original cost of all open positions.</span>
                  </div>
                </li>
                <li>
                  <h5>Current Valuation</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>Paper valuation of all open positions.</span>
                  </div>
                </li>
                <li>
                  <h5>Profit</h5>
                  <div className="text-right">
                    <h5>$0.0000 (0,00%)</h5>
                    <span>Paper profit of all open positions..</span>
                  </div>
                </li>
                <li>
                  <h5>Loss</h5>
                  <div className="text-right">
                    <h5>$0.0000 (0,00%)</h5>
                    <span>Paper loss of all open positions.</span>
                  </div>
                </li>
                <li>
                  <h5>Fees</h5>
                  <div className="text-right">
                    <h5>$0.0000</h5>
                    <span>Current Fee</span>
                  </div>
                </li>
              </PerfectScrollbar>
            </div>
          </div>
        </div>
        <div className="col-xxl-8 col-xl-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Transaction</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive transaction-table">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>Ledger ID</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Currency</th>
                      <th>Amount</th>
                      <th>Fee</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>523640</td>
                      <td>January 15</td>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sell
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>0.02%</td>
                      <td>
                        <strong>0.25484 BTC</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>523640</td>
                      <td>January 15</td>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc LTC"></i> Litecoin
                      </td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>0.02%</td>
                      <td>
                        <strong> 0.25484 LTC</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>523640</td>
                      <td>January 15</td>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc XRP"></i> Ripple
                      </td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>0.02%</td>
                      <td>
                        <strong> 0.25484 LTC</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>523640</td>
                      <td>January 15</td>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc DASH"></i> Dash
                      </td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>0.02%</td>
                      <td>
                        <strong> 0.25484 LTC</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>523640</td>
                      <td>January 15</td>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc LTC"></i> Litecoin
                      </td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>0.02%</td>
                      <td>
                        <strong> 0.25484 LTC</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-6">
          <div className="wallet-widget card">
            <h5>Estimated Balance</h5>
            <h2>
              <span className="text-primary">0.000</span> <sub>USD</sub>
            </h2>
            <p>= 0.000000 BTC</p>
          </div>
        </div>
        <div className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-6">
          <div className="wallet-widget card">
            <h5>Available Balance</h5>
            <h2>
              <span className="text-success">0.000</span> <sub>USD</sub>
            </h2>
            <p>= 0.000000 BTC</p>
          </div>
        </div>
        <div className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-6">
          <div className="wallet-widget card">
            <h5>Pending Balance</h5>
            <h2>
              <span className="text-warning">0.000</span> <sub>USD</sub>
            </h2>
            <p>= 0.000000 BTC</p>
          </div>
        </div>
        <div className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-6">
          <div className="wallet-widget card">
            <h5>Locked Balance</h5>
            <h2>
              <span className="text-danger">0.000</span> <sub>USD</sub>
            </h2>
            <p>= 0.000000 BTC</p>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Wallet Addresses </h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>Coin Name</th>
                      <th>Address</th>
                      <th>QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="coin-name">
                          <i className="cc BTC"></i>
                          <span>Bitcoin</span>
                        </div>
                      </td>
                      <td>35Hb5B6qJa5ntYaNFN3hGYXdAjh919g2VH</td>
                      <td>
                        <img className="qr-img" src={qrImg} alt="" width="40" />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="coin-name">
                          <i className="cc BTC"></i>
                          <span>Bitcoin</span>
                        </div>
                      </td>
                      <td>35Hb5B6qJa5ntYaNFN3hGYXdAjh919g2VH</td>
                      <td>
                        <img className="qr-img" src={qrImg} alt="" width="40" />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="coin-name">
                          <i className="cc BTC"></i>
                          <span>Bitcoin</span>
                        </div>
                      </td>
                      <td>35Hb5B6qJa5ntYaNFN3hGYXdAjh919g2VH</td>
                      <td>
                        <img className="qr-img" src={qrImg} alt="" width="40" />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="coin-name">
                          <i className="cc BTC"></i>
                          <span>Bitcoin</span>
                        </div>
                      </td>
                      <td>35Hb5B6qJa5ntYaNFN3hGYXdAjh919g2VH</td>
                      <td>
                        <img className="qr-img" src={qrImg} alt="" width="40" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Balance</h4>
            </div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6">
                  <div className="balance-chart">
                    <DonutChart />
                    <h4>Total Balance = $ 5360</h4>
                  </div>
                </div>
                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6">
                  <ul className="balance-widget">
                    <li>
                      <div className="icon-title">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </div>
                      <div className="text-right">
                        <h5>0.000242 BTC</h5>
                        <span>0.125 USD</span>
                      </div>
                    </li>
                    <li>
                      <div className="icon-title">
                        <i className="cc USDT"></i>
                        <span>Tether</span>
                      </div>
                      <div className="text-right">
                        <h5>0.000242 USDT</h5>
                        <span>0.125 USD</span>
                      </div>
                    </li>
                    <li>
                      <div className="icon-title">
                        <i className="cc XTZ"></i>
                        <span>Tezos</span>
                      </div>
                      <div className="text-right">
                        <h5>0.000242 XTZ</h5>
                        <span>0.125 USD</span>
                      </div>
                    </li>
                    <li>
                      <div className="icon-title">
                        <i className="cc XMR"></i>
                        <span>Monero</span>
                      </div>
                      <div className="text-right">
                        <h5>0.000242 XMR</h5>
                        <span>0.125 USD</span>
                      </div>
                    </li>
                    <li>
                      <div className="icon-title">
                        <i className="cc XMR"></i>
                        <span>Monero</span>
                      </div>
                      <div className="text-right">
                        <h5>0.000242 XMR</h5>
                        <span>0.125 USD</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Balance </h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Balance</th>
                      <th>Available</th>
                      <th>Locked</th>
                      <th>% Gain</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td className="success-arrow">
                        <strong>0.005%</strong>
                        <i className="icofont-arrow-up ml-2"></i>
                      </td>
                    </tr>
                    <tr>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td className="success-arrow">
                        <strong>0.005%</strong>
                        <i className="icofont-arrow-up ml-2"></i>
                      </td>
                    </tr>
                    <tr>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td className="success-arrow">
                        <strong>0.005%</strong>
                        <i className="icofont-arrow-up ml-2"></i>
                      </td>
                    </tr>
                    <tr>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td className="success-arrow">
                        <strong>0.005%</strong>
                        <i className="icofont-arrow-up ml-2"></i>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Deposit </h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Hash</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>12345</td>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>Jan 01</td>
                      <td>#1236598745565</td>
                      <td>Pending</td>
                    </tr>
                    <tr>
                      <td>12345</td>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>Jan 01</td>
                      <td>#1236598745565</td>
                      <td>Pending</td>
                    </tr>
                    <tr>
                      <td>12345</td>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>Jan 01</td>
                      <td>#1236598745565</td>
                      <td>Pending</td>
                    </tr>
                    <tr>
                      <td>12345</td>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>Jan 01</td>
                      <td>#1236598745565</td>
                      <td>Pending</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Withdrawals </h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Fee</th>
                      <th>Date</th>
                      <th>Hash</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>12345</td>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>0.02%</td>
                      <td>Jan 01</td>
                      <td>#1236598745565</td>
                      <td>Pending</td>
                    </tr>
                    <tr>
                      <td>12345</td>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>0.02%</td>
                      <td>Jan 01</td>
                      <td>#1236598745565</td>
                      <td>Pending</td>
                    </tr>
                    <tr>
                      <td>12345</td>
                      <td className="coin-name">
                        <i className="cc BTC"></i>
                        <span>Bitcoin</span>
                      </td>
                      <td>0</td>
                      <td>0.02%</td>
                      <td>Jan 01</td>
                      <td>#1236598745565</td>
                      <td>Pending</td>
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

export default CardLibrary;
