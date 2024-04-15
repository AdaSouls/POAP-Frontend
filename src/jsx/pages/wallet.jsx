import React from "react";
import qrImg from "../../images/qr.svg";
import DonutChart from "../charts/donut";
import Layout from "../layout/layout";

const Wallet = () => {
  return (
    <Layout activeMenu={3}>
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

export default Wallet;
