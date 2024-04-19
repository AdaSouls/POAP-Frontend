import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { Link } from "react-router-dom";

import logo from "../../images/logo.png";

const Header = () => {
  const onClick = (value) => {
    document.querySelector("body").classList.toggle("dark-theme");
  };

  return (
    <div className="header">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="header-content">
              <div className="header-left">
                <div className="brand-logo">
                  <Link to={"/"}>
                    <img src={logo} alt="" />
                    <span>AdaSouls</span>
                  </Link>
                </div>                
              </div>
              <div className="header-right">
                <div className="dark-light-toggle" onClick={() => onClick()}>
                  <span className="dark">
                    <i className="icofont-moon"></i>
                  </span>
                  <span className="light">
                    <i className="icofont-sun-alt"></i>
                  </span>
                </div>
                <Dropdown className="notification">
                  <Dropdown.Toggle>
                    <div className="notify-bell" data-toggle="dropdown">
                      <span>
                        <i className="icofont-alarm"></i>
                      </span>
                    </div>
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    className="notification-list mt-4"
                    align={"right"}
                  >
                    <h4>Announcements</h4>
                    <div className="lists">
                      <Link to={"#"} className="">
                        <div className="d-flex align-items-center">
                          <span className="mr-3 icon success">
                            <i className="icofont-check"></i>
                          </span>
                          <div>
                            <p>Account created successfully</p>
                            <span>2020-11-04 12:00:23</span>
                          </div>
                        </div>
                      </Link>
                      <Link to={"#"} className="">
                        <div className="d-flex align-items-center">
                          <span className="mr-3 icon fail">
                            <i className="icofont-close"></i>
                          </span>
                          <div>
                            <p>2FA verification failed</p>
                            <span>2020-11-04 12:00:23</span>
                          </div>
                        </div>
                      </Link>
                      <Link to={"#"} className="">
                        <div className="d-flex align-items-center">
                          <span className="mr-3 icon success">
                            <i className="icofont-check"></i>
                          </span>
                          <div>
                            <p>Device confirmation completed</p>
                            <span>2020-11-04 12:00:23</span>
                          </div>
                        </div>
                      </Link>
                      <Link to={"#"} className="">
                        <div className="d-flex align-items-center">
                          <span className="mr-3 icon pending">
                            <i className="icofont-warning"></i>
                          </span>
                          <div>
                            <p>Phone verification pending</p>
                            <span>2020-11-04 12:00:23</span>
                          </div>
                        </div>
                      </Link>

                      <Link to={"./settings-activity"}>
                        More <i className="icofont-simple-right"></i>
                      </Link>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>

                {/* <Dropdown className="profile_log">
                  <Dropdown.Toggle>
                    <span className="thumb">
                      <img src={thumb} alt="" width="30" />
                    </span>
                    <span className="arrow">
                      <i className="icofont-angle-down"></i>
                    </span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className=" mt-4" align={"right"}>
                    <div className="user-email">
                      <div className="user">
                        <span className="thumb">
                          <img src={thumb} alt="" />
                        </span>
                        <div className="user-info">
                          <h5>Jannatul Maowa</h5>
                          <span>Qash.inc@gmail.com</span>
                        </div>
                      </div>
                    </div>

                    <div className="user-balance">
                      <div className="available">
                        <p>Available</p>
                        <span>0.00 BTC</span>
                      </div>
                      <div className="total">
                        <p>Total</p>
                        <span>0.00 USD</span>
                      </div>
                    </div>
                    <Link to={"profile"} className="dropdown-item">
                      <i className="icofont-ui-user"></i>Profile
                    </Link>
                    <Link to={"/wallet"} className="dropdown-item">
                      <i className="icofont-wallet"></i>Wallet
                    </Link>
                    <Link to={"/settings-profile"} className="dropdown-item">
                      <i className="icofont-ui-settings"></i> Setting
                    </Link>
                    <Link to={"/settings-activity"} className="dropdown-item">
                      <i className="icofont-history"></i> Activity
                    </Link>
                    <Link to={"/lock"} className="dropdown-item">
                      <i className="icofont-lock"></i>Lock
                    </Link>
                    <Link to={"/signin"} className="dropdown-item logout">
                      <i className="icofont-logout"></i> Logout
                    </Link>
                  </Dropdown.Menu>
                </Dropdown> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
