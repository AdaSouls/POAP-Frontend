import React from 'react';
import { Link } from 'react-router-dom';
import HeaderIntro from '../layout/header-intro';
import dashboard from '../../images/demo/dashboard.jpg'
import home from '../../images/demo/home.jpg'
import intro from '../../images/demo/intro.jpg'
import trade from '../../images/demo/trade.jpg'
import wallet from '../../images/demo/wallet.jpg'
import price from '../../images/demo/price.jpg'
import pricedetails from '../../images/demo/price-details.jpg'
import profile from '../../images/demo/profile.jpg'
import signin from '../../images/demo/signin.jpg'
import signup from '../../images/demo/signup.jpg'
import reset from '../../images/demo/reset.jpg'
import verifyemail from '../../images/demo/verify-email.jpg'
import verifyphone from '../../images/demo/verify-phone.jpg'
import verifycode from '../../images/demo/verify-code.jpg'
import lock from '../../images/demo/lock.jpg'
import profileedit from '../../images/demo/profile-edit.jpg'
import application from '../../images/demo/application.jpg'
import security from '../../images/demo/security.jpg'
import activity from '../../images/demo/activity.jpg'
import privacy from '../../images/demo/privacy.jpg'
import payment from '../../images/demo/payment.jpg'
import api from '../../images/demo/api.jpg'
import fees from '../../images/demo/fees.jpg'


const Demo = () => {
    return (
        <>
            <HeaderIntro />

            <div class="intro" id="intro" data-scroll-index="0">
                <div class="container">
                    <div class="row align-items-center justify-content-between">
                        <div class="col-xl-6 col-md-6">
                            <div class="intro-content pb-5">
                                <h1>Qash - Crypto Exchange Dashboard React App</h1>
                                <p>Qash is the complete UI Kit for cryptocurrency exchange. Sign in, Signup, Phone and ID
                                card
                                verification, One time password verify and add bank, debit card settings and profile etc
                                pages included. </p>
                                <div class="intro-btn">
                                    <Link to={"#"} class="btn btn-primary mr-3" data-scroll-nav="1">View Demo</Link>
                                    <Link to={"#"} class="btn btn-outline-primary">Buy</Link>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-5 col-md-6 py-md-5">
                            <div class="intro-demo_img">
                                <img src={dashboard} alt="" class="img-fluid" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div class="demo">
                <div class="container">
                    <div class="row py-lg-5 justify-content-center">
                        <div class="col-xl-7">
                            <div class="section-heading text-center">
                                <h2>Pages</h2>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/intro"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={intro} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Intro</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={home} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Dashboard</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/trade"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={trade} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Trade</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/wallet"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={wallet} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Wallet</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/price"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={price} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Price</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/price-details"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={pricedetails} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Price Details</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/profile"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={profile} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Profile</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/signin"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={signin} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Sign in</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/signup"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={signup} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Sign up</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/reset"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={reset} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Reset</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/verify-email"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={verifyemail} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Verify Email</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/otp-1"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={verifyphone} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Verify Phone</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/otp-2"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={verifycode} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Verify Code</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/lock"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={lock} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Lock</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-profile"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={profileedit} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Profile Edit</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-application"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={application} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Application</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-security"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={security} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Security</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-activity"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={activity} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Activity</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-privacy"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={privacy} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Privacy</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-payment-method"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={payment} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Payment</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-api"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={api} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>API</h4>
                            </div>
                        </div>
                        <div class="col-xl-4 col-md-4 col-sm-6">
                            <div class="demo_img">
                                <Link to={"/settings-fees"} target="_blank">
                                    <div class="img-wrap">
                                        <img src={fees} alt="" class="img-fluid" />
                                    </div>
                                </Link>
                                <h4>Fees</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="container">
                    <div class="row">
                        <div class="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-12">
                            <div class="copyright">
                                <p>© Copyright 2020 <Link to={"#"}>Qash</Link> I All Rights Reserved</p>
                            </div>
                        </div>
                        <div class="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-12">
                            <div class="footer-social">
                                <ul>
                                    <li><Link to={"#"}><i class="fa fa-facebook"></i></Link></li>
                                    <li><Link to={"#"}><i class="fa fa-twitter"></i></Link></li>
                                    <li><Link to={"#"}><i class="fa fa-linkedin"></i></Link></li>
                                    <li><Link to={"#"}><i class="fa fa-youtube"></i></Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Demo;