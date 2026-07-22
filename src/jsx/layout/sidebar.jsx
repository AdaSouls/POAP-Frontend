import React from "react";
import { Link } from "react-router-dom";
import homeIcon from "../../icons/menu/home.png";
import walletIconActive from "../../icons/menu/wallet-active.png";
import walletIconInactive from "../../icons/menu/wallet-inactive.png";
import poapIconActive from "../../icons/svg/poap-active.svg";
import poapIconInactive from "../../icons/svg/poap-inactive.svg";
import { useDrawer } from "../contexts/drawer/drawer.provider";

const Sidebar = ({ activeMenu }) => {
  const { cardano, midnight } = useDrawer();

  const getMenus = () => {
    const baseMenus = [
      { id: 1, href: "/", title: "Home", iconActive: homeIcon, iconInactive: homeIcon },
      { id: 2, href: "/events", title: "Events", iconActive: poapIconActive, iconInactive: poapIconInactive },
      { id: 3, href: "/create", title: "Create", iconActive: poapIconActive, iconInactive: poapIconInactive },
      { id: 4, href: "/poap-management", title: "My POAPs", iconActive: poapIconActive, iconInactive: poapIconInactive },
      { id: 5, href: "/wallet", title: "Wallet", iconActive: walletIconActive, iconInactive: walletIconInactive },
    ];

    return baseMenus;
  };

  const menus = getMenus();
  return (
    <div className="sidebar">
      
      <div className="menu">
        <ul>
          {menus.map((item) => (
            <li key={item.id} className={activeMenu === item.id ? "active" : ""}>
              <Link
                to={item.href}
                title={item.title}
                className={activeMenu === item.id ? "active" : ""}
              >
                <span>
                <img src={cardano.wallet || midnight.provider ? item.iconActive : item.iconInactive} alt="" ></img>
                  {/* <i className={item.icon}></i> */}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;