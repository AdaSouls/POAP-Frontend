import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";

import routing from "../../images/routing.png";

import SettingsLayout from "../layout/settings-layout";

const SettingsPaymentMethod = () => {
  const [addedText, setAddedText] = useState("");

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [show1, setShow1] = useState(false);

  const handleClose1 = () => setShow1(false);
  const handleShow1 = () => setShow1(true);

  const [show2, setShow2] = useState(false);
  const handleClose2 = () => setShow2(false);
  const handleShow2 = () => {
    setShow(false);
    setShow2(true);
  };
  return (
    <SettingsLayout pageTitle={"Payment Method"} activeMenuID={6}>
      <div className="card-body">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header px-0">
                <h4 className="card-title">Add a payment method </h4>
              </div>
              <div className="card-body px-0">
                <div className="verify-content">
                  <div className="d-flex align-items-center">
                    <span className="mr-3 icon-circle bg-primary text-white">
                      <i className="icofont-ui-touch-phone"></i>
                    </span>
                    <div className="primary-number">
                      <p className="mb-0">Bank of America</p>
                      <small>Bank **************5421</small>
                      <br />
                      <span className="text-success">Verified</span>
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
                      <p className="mb-0">Master Card</p>
                      <small>Credit Card *********5478</small>
                      <br />
                      <span className="text-success">Verified</span>
                    </div>
                  </div>
                  <button className=" btn btn-outline-primary">Manage</button>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    className="btn btn-primary mr-3"
                    onClick={handleShow1}
                  >
                    Add New Bank
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleShow}
                  >
                    Add New Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={show1} onHide={handleClose1}>
        <Modal.Header>
          <Modal.Title>Add Bank Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="identity-upload"
          >
            <div className="row g-3">
              <div className="col-xl-12">
                <label className="form-label">Routing number </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={25487}
                />
              </div>
              <div className="col-xl-12">
                <label className="form-label">Account number </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={36475}
                />
              </div>
              <div className="col-xl-12">
                <label className="form-label">Fulll name </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Jannatul Maowa"
                />
              </div>
              <div className="col-xl-12">
                <img src={routing} alt="" class="img-fluid" />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShow1(false);
              setShow2(true);
              setAddedText("Congratulation. Your bank added");
            }}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header>
          <Modal.Title>Add Card</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form class="identity-upload">
            <div class="row g-3">
              <div class="col-xl-12">
                <label class="form-label">Name on card </label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Jannatul Maowa"
                />
              </div>
              <div class="col-xl-12">
                <label class="form-label">Card number </label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="5658 4258 6358 4756"
                />
              </div>
              <div class="col-xl-4">
                <label class="form-label">Expiration </label>
                <input type="text" class="form-control" placeholder="10/22" />
              </div>
              <div class="col-xl-4">
                <label class="form-label">CVC </label>
                <input type="text" class="form-control" placeholder="125" />
              </div>
              <div class="col-xl-4">
                <label class="form-label">Postal code </label>
                <input type="text" class="form-control" placeholder="2368" />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShow(false);
              setShow2(true);
              setAddedText("Congratulation. Your card added");
            }}
          >
            Confirm
          </Button>
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
                    <i className="icofont-check" />
                  </span>
                  <p className="text-dark">{addedText}</p>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </SettingsLayout>
  );
};

export default SettingsPaymentMethod;
