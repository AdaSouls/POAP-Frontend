import React from "react";
import { Link } from "react-router-dom";
import SettingsLayout from "../layout/settings-layout";

const SettingsPrivacy = () => {
  return (
    <SettingsLayout pageTitle={"Privacy"} activeMenuID={5}>
      <div className="card-body">
        <div className="row">
          <div className="col-xl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">Privacy options </h4>
              </div>
              <div className="card-body px-0">
                <h5>Instant sends</h5>
                <p className="mb-1">
                  Allow other users to see that you use Qash and send you crypto
                  instantly
                </p>
                <div className="form-check form-switch mt-3">
                  <input className="form-check-input" type="checkbox" id="s8" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">Your Qash account</h4>
              </div>
              <div className="card-body px-0">
                <p>
                  You have a number of rights over your personal data. For more
                  detailed information on these choices, please read our full{" "}
                  <Link to={"#"}>Privacy Policy</Link> and our{" "}
                  <Link to={"#"}>Cookie Policy</Link>.
                </p>

                <hr className="dropdown-divider my-4" />

                <div className="privacy-content">
                  <h5>Request Data</h5>
                  <p>Request a copy of my personal data held by Qash.</p>
                  <Link to={"#"} className="btn btn-outline-primary">
                    Request data
                  </Link>
                </div>

                <hr className="dropdown-divider my-4" />

                <div className="privacy-content">
                  <h5>Request Deletion</h5>
                  <p>Request deletion of some or all of my data</p>
                  <Link to={"#"} className="btn btn-outline-primary">
                    Request deletion
                  </Link>
                </div>

                <hr className="dropdown-divider my-4" />

                <div className="privacy-content">
                  <h5>Request export</h5>
                  <p>Request export of my data in a machine-readable form.</p>
                  <Link to={"#"} className="btn btn-outline-primary">
                    Request data export
                  </Link>
                </div>

                <hr className="dropdown-divider my-4" />

                <div className="privacy-content">
                  <h5>Request Correction</h5>
                  <p>Request to correct, modify, or complete my data.</p>
                  <Link to={"#"} className="btn btn-outline-primary">
                    Request correction
                  </Link>
                </div>

                <hr className="dropdown-divider my-4" />

                <div className="privacy-content">
                  <h5>
                    Request Restriction of Processing (EU and Japan Residents
                    only)
                  </h5>
                  <p>Request that Qash stops processing my personal data.</p>
                  <Link to={"#"} className="btn btn-outline-primary">
                    Request restriction
                  </Link>
                </div>

                <hr className="dropdown-divider my-4" />

                <div className="privacy-content">
                  <h5>Manage Cookies</h5>
                  <p>Manage your cookie preferences.</p>
                  <Link to={"#"} className="btn btn-outline-primary">
                    Request cookies
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsPrivacy;
