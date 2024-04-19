import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../layout/layout";

const Search = () => {
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
    <Layout activeMenu={2}>
      <div className="row">
        <div className="search">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search Here"
              />
              <span className="input-group-text">
                <i className="icofont-search"></i>
              </span>
            </div>
          </form>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Buy Transaction</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Coin Name</th>
                      <th>Wallet</th>
                      <th>Amount</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Bank *******5264</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc LTC"></i> Litecoin
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc XRP"></i> Ripple
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc DASH"></i> Dash
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
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
              <h4 className="card-title">Sell Transaction</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Coin Name</th>
                      <th>Wallet</th>
                      <th>Amount</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Bank *******5264</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc LTC"></i> Litecoin
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc XRP"></i> Ripple
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc DASH"></i> Dash
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
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
              <h4 className="card-title">Transfer Transaction</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Coin Name</th>
                      <th>Wallet</th>
                      <th>Amount</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Bank *******5264</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc LTC"></i> Litecoin
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc XRP"></i> Ripple
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc DASH"></i> Dash
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
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
              <h4 className="card-title">Convert Transaction</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped responsive-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Coin Name</th>
                      <th>Wallet</th>
                      <th>Amount</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Bank *******5264</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc LTC"></i> Litecoin
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc XRP"></i> Ripple
                      </td>
                      <td>Using - Card *******8475</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="success-arrow">
                          <i className="icofont-arrow-up"></i>
                          Buy
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc DASH"></i> Dash
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-success">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="danger-arrow">
                          <i className="icofont-arrow-down"></i>
                          Sold
                        </span>
                      </td>
                      <td className="coin-name">
                        <i className="cc BTC"></i> Bitcoin
                      </td>
                      <td>Using - Card *******2321</td>
                      <td className="text-danger">-0.000242 BTC</td>
                      <td>-0.125 USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header>
          <h5 className="modal-title">Confirmation</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => handleClose()}
          />
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <table className="table">
              <tbody>
                <tr>
                  <td>
                    <span className="text-primary">Buyer Email</span>
                  </td>
                  <td>
                    <span className="text-primary">buyer@example.com</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="text-primary">Seller Email</span>
                  </td>
                  <td>
                    <span className="text-primary">seller@example.com</span>
                  </td>
                </tr>
                <tr>
                  <td>Exchange Rate</td>
                  <td>0.00212455 BTC</td>
                </tr>
                <tr>
                  <td>Fee</td>
                  <td>$28.00 USD</td>
                </tr>
                <tr>
                  <td>Total</td>
                  <td>$854.00 USD</td>
                </tr>
                <tr>
                  <td>Vat</td>
                  <td>
                    <div className="text-danger">$25.00 USD</div>
                  </td>
                </tr>
                <tr>
                  <td>Sub Total</td>
                  <td>$1232.00 USD</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-end d-flex justify-content-end mt-4">
            <button
              type="button"
              className="btn btn-primary"
              data-dismiss="modal"
              data-toggle="modal"
              data-target="#buySuccessleModal"
              onClick={handleShow2}
            >
              Confirm
            </button>
          </div>
        </Modal.Body>
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
            <form onSubmit={handleSubmit} className="identity-upload">
              <div className="identity-content">
                <span className="icon">
                  <i className="icofont-check" />
                </span>
                <p>Congratulation. Your transaction is successful</p>
              </div>
            </form>
            <div className="card-footer text-center">
              <Link to={"/signup"}>Go to Transaction</Link>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default Search;
