import React from 'react';
import { Link } from 'react-router-dom';
import HeaderIntro from '../layout/header-intro';
import dashboard from '../../images/demo/dashboard.jpg'

const Intro = () => {
    return (
        <>
            <HeaderIntro />
            <div className="intro" id="intro" data-scroll-index="0">
                <div className="container">
                    <div className="row align-items-center justify-content-between">
                        <div className="col-xl-6 col-md-6">
                            <div className="intro-content pb-5">
                                <h1>Qash - Crypto Exchange Dashboard React App</h1>
                                <p>Qash is the complete UI Kit for cryptocurrency exchange. Sign in, Signup, Phone and ID
                                card
                                verification, One time password verify and add bank, debit card settings and profile etc
                                pages included. </p>
                                <div className="intro-btn">
                                    <Link to={"/signin"} className="btn btn-primary">Get Started</Link>
                                    <Link to={"/"} className="btn btn-outline-primary">Browse Now</Link>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-5 col-md-6 py-md-5">
                            <div className="intro-demo_img">
                                <img src={dashboard} alt="" className="img-fluid" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Intro;