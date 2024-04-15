import React from "react";
import SettingsLayout from "../layout/settings-layout";

const SettingsApi = () => {
  return (
    <SettingsLayout pageTitle={"API"} activeMenuID={7}>
      <div className="card-body">
        <div className="row">
          <div className="col-xxl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">Create API Key</h4>
              </div>
              <div className="card-body px-0">
                <form action="#">
                  <div className="row g-3">
                    <div className="col-xl-6 col-md-6">
                      <label className="form-label">Generate New Key</label>
                      <input
                        type="text"
                        name="usd_amount"
                        className="form-control"
                        placeholder="Enter Passphrase"
                      />
                    </div>
                    <div className="col-xl-6 col-md-6">
                      <label className="form-label">Confirm Passphrase</label>
                      <input
                        type="text"
                        name="usd_amount"
                        className="form-control"
                        placeholder="Re-enter passphrase"
                      />
                    </div>
                    <div className="col-auto">
                      <button className="btn btn-primary">
                        Create API Keys
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-xl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">Your API Keys</h4>
              </div>
              <div className="card-body px-0">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>69e387f1-31c3-45ad-9c68-5a51e5e78b43</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked
                            />
                          </div>
                        </td>
                        <td>
                          <span>
                            <i className="icofont-ui-delete"></i>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>69e387f1-31c3-45ad-9c68-5a51e5e78b43</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                            />
                          </div>
                        </td>
                        <td>
                          <span>
                            <i className="icofont-ui-delete"></i>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>69e387f1-31c3-45ad-9c68-5a51e5e78b43</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                            />
                          </div>
                        </td>
                        <td>
                          <span>
                            <i className="icofont-ui-delete"></i>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>69e387f1-31c3-45ad-9c68-5a51e5e78b43</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                            />
                          </div>
                        </td>
                        <td>
                          <span>
                            <i className="icofont-ui-delete"></i>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>69e387f1-31c3-45ad-9c68-5a51e5e78b43</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                            />
                          </div>
                        </td>
                        <td>
                          <span>
                            <i className="icofont-ui-delete"></i>
                          </span>
                        </td>
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

export default SettingsApi;
