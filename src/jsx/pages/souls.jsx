import React from "react";
import { Link } from "react-router-dom";
import PriceArea from "../charts/price-area";
import Layout from "../layout/layout";

const Souls = () => {
  const prices = [
    { id: 1, title: "Bitcoin", icon: "BTC-alt", value: "11,785.10" },
    { id: 2, title: "Ethereum", icon: "ETH-alt", value: "11,785.10" },
    { id: 3, title: "Tether", icon: "USDT-alt", value: "11,785.10" },
    { id: 4, title: "Ripple", icon: "XRP-alt", value: "11,785.10" },
    { id: 5, title: "Litecoin", icon: "LTC-alt", value: "11,785.10" },
    { id: 6, title: "Cardano", icon: "ADA-alt", value: "11,785.10" },
    { id: 7, title: "EOS", icon: "EOS-alt", value: "11,785.10" },
    { id: 8, title: "Monero", icon: "XMR-alt", value: "11,785.10" },
    { id: 9, title: "Tezos", icon: "XTZ-alt", value: "11,785.10" },
    { id: 10, title: "NEM", icon: "XEM-alt", value: "11,785.10" },
    { id: 11, title: "NEO", icon: "NEO-alt", value: "11,785.10" },
    { id: 12, title: "Dash", icon: "DASH-alt", value: "11,785.10" },
    { id: 13, title: "Ethereum", icon: "ETC-alt", value: "11,785.10" },
    { id: 14, title: "DigiByte", icon: "DGB-alt", value: "11,785.10" },
    { id: 15, title: "Decred", icon: "DCR-alt", value: "11,785.10" },
  ];

  return (
    <Layout activeMenu={3}>
      <div className="row">
        {prices.map((price) => (
          <div
            key={price.id}
            className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-6"
          >
            <div
              className={`price-widget position-relative  bg-${price.icon
                .split("-")[0]
                .toLocaleLowerCase()}`}
            >
              <Link to={"/price-details"}>
                <div className="price-content">
                  <div className="icon-title">
                    <i className={`cc ${price.icon}`}></i>
                    <span>{price.title}</span>
                  </div>
                  <h5>$ {price.value}</h5>
                </div>
                <PriceArea />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Souls;
