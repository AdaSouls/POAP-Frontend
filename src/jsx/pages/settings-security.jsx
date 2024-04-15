import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import SettingsLayout from "../layout/settings-layout";

const SettingsSecurity = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show2, setShow2] = useState(false);
  const handleClose2 = () => setShow2(false);
  const handleShow2 = () => {
    setShow(false);
    setShow2(true);
  };
  return (
    <SettingsLayout pageTitle={"Security"} activeMenuID={3}>
      <div className="card-body">
        <div className="row">
          <div className="col-xxl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">2-step verification </h4>
              </div>
              <div className="card-body px-0">
                <div className="verify-content ">
                  <div className="d-flex align-items-center">
                    <span className="mr-3 icon-circle bg-primary text-white">
                      <i className="icofont-ui-touch-phone"></i>
                    </span>
                    <div className="primary-number">
                      <p className="mb-0">
                        <strong>+xxx xxxxxxxx60</strong>
                      </p>
                      <small>Keep your primary phone number up-to-date</small>
                      <br />
                      <span className="text-success">Required</span>
                    </div>
                  </div>
                  <button className=" btn btn-outline-primary">Manage</button>
                </div>
                <hr className="dropdown-divider my-4" />
                <div className="verify-content">
                  <div className="d-flex align-items-center">
                    <span className="mr-3 icon-circle bg-primary text-white">
                      <i className="icofont-email"></i>
                    </span>
                    <div className="primary-number">
                      <p className="mb-0">
                        <strong>hello@example.com</strong>
                      </p>
                      <small>Keep your primary email up-to-date</small>
                      <br />
                      <span className="text-success">Required</span>
                    </div>
                  </div>
                  <button className=" btn btn-outline-primary">Manage</button>
                </div>
                <hr className="dropdown-divider my-4" />
                <div className="verify-content">
                  <div className="d-flex align-items-center">
                    <span className="mr-3 icon-circle bg-primary text-white">
                      <i className="icofont-lock"></i>
                    </span>
                    <div className="primary-number">
                      <p className="mb-0">
                        <strong>*************</strong>
                      </p>
                      <small>You can change your password</small>
                      <br />
                      <span className="text-success">Required</span>
                    </div>
                  </div>
                  <button className=" btn btn-outline-primary">Manage</button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">Identity verification </h4>
              </div>
              <div className="card-body px-0">
                <div className="verify-content">
                  <div className="d-flex align-items-center">
                    <span className="mr-3 icon-circle bg-primary text-white">
                      <i className="icofont-id"></i>
                    </span>
                    <div className="primary-number">
                      <p className="mb-0">xxx xxxxx xxx40</p>
                      <small>Social Security Number</small>
                      <br />
                      <span className="text-success">Verified</span>
                    </div>
                  </div>
                  <button
                    className=" btn btn-outline-primary"
                    data-toggle="modal"
                    data-target="#idCardModal"
                    onClick={setShow}
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">
                  Use 2-step verification to secure your transactions{" "}
                </h4>
              </div>
              <div className="card-body px-0">
                <form action="#">
                  <div className="col-12">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="s1"
                        checked
                      />
                      <label className="form-check-label" for="s1">
                        Any amount of cryptocurrency{" "}
                        <b className="text-success">Most secure</b>
                      </label>
                    </div>
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="s2"
                        checked
                      />
                      <label className="form-check-label" for="s2">
                        Over 1.2000 BTC per day
                      </label>
                    </div>

                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="s3"
                        checked
                      />
                      <label className="form-check-label" for="s3">
                        Never <b className="text-danger">Least secure</b>
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <button className="btn btn-success">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header>
          <h5 className="modal-title">Upload your ID card</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => handleClose()}
          />
        </Modal.Header>
        <Modal.Body>
          <form className="identity-upload">
            <div className="identity-content">
              <span>(Driving License or Government ID card)</span>
              <p>
                Uploading your ID helps as ensure the safety and security of
                your founds
              </p>
            </div>
            <div className="form-group">
              <label className="me-sm-2">Upload Front ID </label>
              <span className="float-right">Maximum file size is 2mb</span>
              <div className="file-upload-wrapper" data-text="front.jpg">
                <input
                  name="file-upload-field"
                  type="file"
                  className="file-upload-field"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="me-sm-2">Upload Back ID </label>
              <span className="float-right">Maximum file size is 2mb</span>
              <div className="file-upload-wrapper" data-text="back.jpg">
                <input
                  name="file-upload-field"
                  type="file"
                  className="file-upload-field"
                />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <div className="text-end d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-success"
              data-dismiss="modal"
              data-toggle="modal"
              data-target="#buySuccessleModal"
              onClick={handleShow2}
            >
              Submit
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal show={show2} onHide={handleClose2}>
        <Modal.Header>
          <h5 className="modal-title">Success</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => handleClose2()}
          />
        </Modal.Header>
        <Modal.Body>
          <div className="auth-form">
            <div className="card-body">
              <form className="identity-upload">
                <div className="identity-content">
                  <span className="icon">
                    <i className="icofont-email" />
                  </span>
                  <h5>Identity Verified</h5>
                  <p>
                    Congrats! your identity has been successfully verified and
                    your investment limit has been increased.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </SettingsLayout>
  );
};

export default SettingsSecurity;
