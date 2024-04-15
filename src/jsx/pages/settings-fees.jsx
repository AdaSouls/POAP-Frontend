import React from "react";
import SettingsLayout from "../layout/settings-layout";

const SettingsFees = () => {
  return (
    <SettingsLayout pageTitle={"Fees"} activeMenuID={8}>
      <div className="card-body">
        <div className="row">
          <div className="col-xxl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">Normal User </h4>
              </div>
              <div className="card-body px-0">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tier</th>
                        <th>Total Qash holding</th>
                        <th>30-day Trading Volume (BTC)</th>
                        <th>Maker Fee</th>
                        <th>Taker Fee</th>
                        <th>24h Withdrawal Limit (BTC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">VIP User </h4>
              </div>
              <div className="card-body px-0">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tier</th>
                        <th>Total Qash holding</th>
                        <th>30-day Trading Volume (BTC)</th>
                        <th>Maker Fee</th>
                        <th>Taker Fee</th>
                        <th>24h Withdrawal Limit (BTC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                      <tr>
                        <td>Lv 1</td>
                        <td>&#60; 500</td>
                        <td>&#60; 1000</td>
                        <td>&#60; 0.100%</td>
                        <td>&#60; 0.150%</td>
                        <td>500</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsFees;
