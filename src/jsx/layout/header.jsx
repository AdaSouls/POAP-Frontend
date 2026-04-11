import React from "react";
// import Dropdown from "react-bootstrap/Dropdown";
import { Link } from "react-router-dom";
import loadingGif from "../../images/loading.gif";
import logo from "../../images/logo.png";

const Header = () => {
  // const onClick = (value) => {
  //   document.querySelector("body").classList.toggle("dark-theme");
  // };

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
                {/* {globalLoading.length &&
                  <div className="dark-light-toggle">
                    <span className="dark">
                      <img
                      src={loadingGif}
                      width="24"
                      height="24"
                      />
                    </span>                  
                  </div>                
                } */}
                <div className="dark-light-toggle" onClick={() => onClick()}>
                  <span className="dark">
                    <i className="icofont-moon"></i>
                  </span>
                  <span className="light">
                    <i className="icofont-sun-alt"></i>
                  </span>
                </div>                
                {/* <Dropdown className="notification pr-0 mr-0">
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
                    <h4>Notifications</h4>
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
                          <span className="mr-3 icon loading">
                          <img
                            src={loadingGif}
                            width="24"
                            height="24"
                          />
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

                      
                    </div>
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
