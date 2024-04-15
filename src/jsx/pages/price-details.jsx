import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/header'
import Sidebar from '../layout/sidebar';
import PriceAreaDetails from '../charts/price-area-details'

const PriceDetails = () => {
    return (
        <>
            <Header />
            <Sidebar />
            <div className="content-body">
                <div className="container">
                    <div className="row">
                        <div className="col-xxl-8 col-xl-8">
                            <div className="card">
                                <div className="card-body">
                                    <div className="this-coin-price">
                                        <h3>
                                            1,145,062.90
                                        <sub>USD</sub>
                                        </h3>
                                        <span className="text-danger">-0.2.30% <i className="icofont-arrow-down"></i></span>
                                    </div>
                                    <PriceAreaDetails/>
                                    <div className="chart-content text-center">
                                        <div className="row">
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">24hr Volume</p>
                                                    <h5>$1236548.325</h5>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">Market Cap</p>
                                                    <h5>19B USD</h5>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">Circulating Supply</p>
                                                    <h5>29.4M BTC</h5>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">All Time High</p>
                                                    <h5>19.783.06 USD</h5>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">Typical hold time </p>
                                                    <h5>88 days</h5>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">Trading activity </p>
                                                    <h5>70% buy </h5>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">Popularity </p>
                                                    <h5>#1 most held </h5>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6">
                                                <div className="chart-stat">
                                                    <p className="mb-1">Popularity </p>
                                                    <h5>#1 most held </h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-4 col-xl-4">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title">Price correlation with </h4>
                                </div>
                                <div className="card-body">
                                    <ul className="balance-widget">
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc BTC"></i>
                                                <span>Bitcoin <br /> <small>Moves together</small></span>

                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>64% </span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc LTC"></i>
                                                <span>Litecoin <br /> <small>Moves together</small></span>
                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>0.125 %</span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc XRP"></i>
                                                <span>Ripple <br /> <small>Moves together</small></span>
                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>0.125 %</span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc DASH"></i>
                                                <span>Dash <br /> <small>Moves together</small></span>
                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>0.125 %</span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc XRP"></i>
                                                <span>Ripple <br /> <small>Moves together</small></span>
                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>0.125 %</span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc DASH"></i>
                                                <span>Dash <br /> <small>Moves together</small></span>
                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>0.125 %</span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc DASH"></i>
                                                <span>Dash <br /> <small>Moves together</small></span>
                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>0.125 %</span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="icon-title">
                                                <i className="cc DASH"></i>
                                                <span>Dash <br /> <small>Moves together</small></span>
                                            </div>
                                            <div className="text-right">
                                                <h5>0.000242 USD</h5>
                                                <span>0.125 %</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-6">
                            <div className="card">
                                <div className="card-body">
                                    <div className="invite-content">
                                        <h4>Invite a friend and get $30</h4>
                                        <p>Know someone curious about crypto? You will receive up to $30 when they：
                                        1.Buy
                                        Crypto 2. Deposit 3. Finish Trading Tasks <br /> <Link to={"#"}>Learn more</Link>

                                        </p>

                                        <div className="copy-link">
                                            <form action="#">
                                                <div className="input-group">
                                                    <input type="text" className="form-control"
                                                        value="https://www.Qash.io/join/12345" />
                                                    <span className="input-group-text">Copy</span>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="social-share-link">
                                            <Link to={"#"}><span><i className="icofont-facebook"></i></span></Link>
                                            <Link to={"#"}><span><i className="icofont-twitter"></i></span></Link>
                                            <Link to={"#"}><span><i className="icofont-whatsapp"></i></span></Link>
                                            <Link to={"#"}><span><i className="icofont-telegram"></i></span></Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-6">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title">Deposit</h4>
                                </div>
                                <div className="card-body">

                                    <div className="price-deposit">

                                        <form action="#">
                                            <label className="form-label">BTC Deposit Address</label>
                                            <div className="input-group">
                                                <input type="text" className="form-control"
                                                    value="35Hb5B6qJa5ntYaNFN3hGYXdAjh919g2VH" />
                                                <span className="input-group-text">Copy</span>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="mt-4">
                                        <Link to={"#"} className="btn btn-primary btn-block">Withdraw BTC</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-6">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title">Buy </h4>
                                </div>
                                <div className="card-body">
                                    <form name="myform" className="currency_validate">
                                        <label className="form-label">Buy BTC</label>
                                        <div className="input-group">
                                            <input type="text" name="currency_amount" className="form-control"
                                                placeholder="0.0214 BTC" />
                                            <select className="form-control" name="method">
                                                <option value="bank">USD</option>
                                                <option value="master">Euro</option>
                                            </select>
                                        </div>

                                        <button type="submit" name="submit" className="btn btn-success btn-block mt-4">Buy
                                        Now</button>

                                    </form>

                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-6">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title">Sell </h4>
                                </div>
                                <div className="card-body">
                                    <form name="myform" className="currency_validate">
                                        <label className="form-label">Sell BTC</label>
                                        <div className="input-group">
                                            <input type="text" name="currency_amount" className="form-control"
                                                placeholder="0.0214 BTC" />
                                            <select className="form-control" name="method">
                                                <option value="bank">USD</option>
                                                <option value="master">Euro</option>
                                            </select>
                                        </div>

                                        <button type="submit" name="submit" className="btn btn-success btn-block mt-4">Sell
                                        Now</button>

                                    </form>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PriceDetails;