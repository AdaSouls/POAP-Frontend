import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../images/logo.png";

const Lock = () => {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/");
  };
  return (
    <div className="authincation section-padding">
      <div className="container h-100">
        <div className="row justify-content-center h-100 align-items-center">
          <div className="col-xl-4 col-md-5">
            <div className="mini-logo text-center my-3">
              <Link to={"/"}>
                <img src={logo} alt="" />
              </Link>
              <h4 className="card-title mt-3">Locked</h4>
            </div>
            <div className="auth-form card">
              <div className="card-body">
                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Enter Password</label>

                    <input
                      type="password"
                      className="form-control"
                      placeholder="***********"
                    />
                  </div>
                  <div className="text-center mt-4">
                    <button type="submit" className="btn btn-primary btn-block">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lock;
