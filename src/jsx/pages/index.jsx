import React from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Link } from "react-router-dom";
import AreaChart from "../charts/area";
import DonutChart from "../charts/donut";
import PriceArea from "../charts/price-area";

import profile2 from "../../images/profile/2.png";
import Layout from "../layout/layout";

const Dashboard = () => {
  return (
    <Layout activeMenu={1}>
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
        <div className="col-xxl-3 col-xl-6 col-lg-6">
          <div className="card welcome-profile">
            <div className="card-body">
              <img src={profile2} alt="" />
              <h4>Welcome, Jannatul Maowa!</h4>
              <p>
                Looks like you are not verified yet. Verify yourself to use the
                full potential of Qash.
              </p>

              <ul>
                <li>
                  <Link to={"#"}>
                    <span className="verified">
                      <i className="icofont-check-alt"></i>
                    </span>
                    Verify account
                  </Link>
                </li>
                <li>
                  <Link to={"#"}>
                    <span className="not-verified">
                      <i className="icofont-close-line"></i>
                    </span>
                    Two-factor authentication (2FA)
                  </Link>
                </li>
                <li>
                  <Link to={"#"}>
                    <span className="not-verified">
                      <i className="icofont-close-line"></i>
                    </span>
                    Deposit money
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-xxl-3 col-xl-6 col-lg-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Quick Trade </h4>
            </div>
            <div className="card-body">
              <form
                method="post"
                name="myform"
                className="currency_validate trade-form row g-3"
              >
                <div className="col-12">
                  <label className="form-label">You Send</label>
                  <div className="input-group">
                    <select className="form-select" name="method">
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
                  <label className="form-label">You get</label>
                  <div className="input-group">
                    <select className="form-select" name="method">
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
                  type="submit"
                  name="submit"
                  className="btn btn-success btn-block"
                >
                  Exchange Now
                </button>
              </form>
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
                <div className="col-xxl-6 col-xl-6 col-lg-6">
                  <div className="balance-chart">
                    <DonutChart />
                    <h4>Total Balance = $ 5360</h4>
                  </div>
                </div>
                <div className="col-xxl-6 col-xl-6 col-lg-6">
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
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    </Layout>
  );
};

export default Dashboard;
