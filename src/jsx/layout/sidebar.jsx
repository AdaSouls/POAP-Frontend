import React from "react";
import { Link } from "react-router-dom";
import logo from "../../images/logo.png";

const Sidebar = ({ activeMenu }) => {
  const menus = [
    { id: 1, href: "/", title: "Home", icon: "icofont-ui-home" },
    { id: 2, href: "/trade", title: "Trade", icon: "icofont-stack-exchange" },
    { id: 3, href: "/wallet", title: "Wallet", icon: "icofont-wallet" },
    { id: 4, href: "/price", title: "Price", icon: "icofont-price" },
    {
      id: 5,
      href: "/settings-profile",
      title: "Settings",
      icon: "icofont-ui-settings",
    },
  ];
  return (
    <div className="sidebar">
      <div className="brand-logo">
        <Link to={"/"}>
          <img src={logo} alt="" />
        </Link>
      </div>
      <div className="menu">
        <ul>
          {menus.map((item) => (
            <li key={item.id} className={activeMenu == item.id ? "active" : ""}>
              <Link
                to={item.href}
                title={item.title}
                className={activeMenu == item.id ? "active" : ""}
              >
                <span>
                  <i className={item.icon}></i>
                </span>
              </Link>
            </li>
          ))}

          <li className="logout">
            <Link to={"/signin"} title="Signout">
              <span>
                <i className="icofont-power"></i>
              </span>
            </Link>
          </li>
        </ul>

        <p className="copyright">
          &#169; <Link to={"/#"}>Qcash</Link>
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
