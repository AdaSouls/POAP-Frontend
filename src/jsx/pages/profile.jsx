import React from "react";
import { Link } from "react-router-dom";

import android from "../../images/android.svg";
import apple from "../../images/apple.svg";
import profile2 from "../../images/profile/2.png";
import Layout from "../layout/layout";

const Profile = () => {
  return (
    <Layout>
      <div className="row">
        <div className="col-xxl-6 col-xl-6 col-lg-6">
          <div className="card welcome-profile">
            <div className="card-body">
              <img src={profile2} alt="" />
              <h4>Welcome, Jannatul Maowa!</h4>
              <p>
                Looks like you are not verified yet. Verify yourself to use the
                full potential of Qash.
              </p>

              <ul>
                <li>
                  <Link to={"#"}>
                    <span className="verified">
                      <i className="icofont-check-alt"></i>
                    </span>
                    Verify account
                  </Link>
                </li>
                <li>
                  <Link to={"#"}>
                    <span className="not-verified">
                      <i className="icofont-close-line"></i>
                    </span>
                    Two-factor authentication (2FA)
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-xxl-6 col-xl-6 col-lg-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Download App</h4>
            </div>
            <div className="card-body">
              <div className="app-link">
                <h5>Get Verified On Our Mobile App</h5>
                <p>
                  Verifying your identity on our mobile app more secure, faster,
                  and reliable.
                </p>
                <Link to={"#"} className="btn btn-primary">
                  <img src={android} alt="" />
                </Link>
                <br />
                <div className="mt-3"></div>
                <Link to={"#"} className="btn btn-primary">
                  <img src={apple} alt="" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Information </h4>
              <Link href="/settings-profile" className="btn btn-primary">
                Edit
              </Link>
            </div>
            <div className="card-body">
              <form className="row">
                <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6">
                  <div className="user-info">
                    <span>USER ID</span>
                    <h4>818778</h4>
                  </div>
                </div>
                <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6">
                  <div className="user-info">
                    <span>EMAIL ADDRESS</span>
                    <h4>email@example.com</h4>
                  </div>
                </div>
                <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6">
                  <div className="user-info">
                    <span>COUNTRY OF RESIDENCE</span>
                    <h4>Bangladesh</h4>
                  </div>
                </div>
                <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6">
                  <div className="user-info">
                    <span>JOINED SINCE</span>
                    <h4>20/10/2020</h4>
                  </div>
                </div>
                <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6">
                  <div className="user-info">
                    <span>TYPE</span>
                    <h4>Personal</h4>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xxl-8 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">VERIFY & UPGRADE </h4>
            </div>
            <div className="card-body">
              <h5>
                Account Status :{" "}
                <span className="text-warning">
                  Pending <i className="icofont-warning"></i>
                </span>{" "}
              </h5>
              <p>
                Your account is unverified. Get verified to enable funding,
                trading, and withdrawal.
              </p>
              <Link to={"#"} className="btn btn-primary">
                {" "}
                Get Verified
              </Link>
            </div>
          </div>
        </div>
        <div className="col-xxl-4 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Earn 30% Commission </h4>
            </div>
            <div className="card-body">
              <p>Refer your friends and earn 30% of their trading fees.</p>
              <Link to={"#"} className="btn btn-primary">
                {" "}
                Referral Program
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
