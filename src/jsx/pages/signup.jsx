import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../images/logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/verify-email");
  };
  return (
    <div className="authincation section-padding">
      <div className="container h-100">
        <div className="row justify-content-center h-100 align-items-center">
          <div className="col-xl-5 col-md-6">
            <div className="mini-logo text-center my-4">
              <Link to={"/"}>
                <img src={logo} alt="" />
              </Link>
              <h4 className="card-title mt-3">Create your account</h4>
            </div>
            <div className="auth-form card">
              <div className="card-body">
                <form
                  name="myform"
                  className="signin_validate row g-3"
                  onSubmit={handleSubmit}
                >
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name"
                      name="name"
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="hello@example.com"
                      name="email"
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      name="password"
                    />
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="flexSwitchCheckDefault"
                      />
                      <label
                        className="form-check-label"
                        for="flexSwitchCheckDefault"
                      >
                        I certify that I am 18 years of age or older, and agree
                        to the{" "}
                        <Link to={"#"} className="text-primary">
                          User Agreement
                        </Link>{" "}
                        and{" "}
                        <Link to={"#"} className="text-primary">
                          Privacy Policy
                        </Link>
                        .
                      </label>
                    </div>
                  </div>

                  <div className="text-center">
                    <button type="submit" className="btn btn-primary btn-block">
                      Create account
                    </button>
                  </div>
                </form>
                <div className="text-center">
                  <p className="mt-3 mb-0">
                    {" "}
                    <Link className="text-primary" to={"/signin"}>
                      Sign in
                    </Link>{" "}
                    to your account
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
