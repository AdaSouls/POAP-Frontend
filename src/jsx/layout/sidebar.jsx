import React from "react";
import { Link } from "react-router-dom";
import homeIcon from "../../icons/menu/home.png";
import searchIcon from "../../icons/menu/search.png";
import soulsIconActive from "../../icons/menu/souls-active.png";
import walletIconActive from "../../icons/menu/wallet-active.png";
import soulsIconInactive from "../../icons/menu/souls-inactive.png";
import walletIconInactive from "../../icons/menu/wallet-inactive.png";
// import settingsIcon from "../../icons/menu/settings.png";
import adaSoulsIconActive from "../../icons/menu/ada-souls-active.png";
import adaSoulsIconInactive from "../../icons/menu/ada-souls-inactive.png";
import { useDrawer } from "../contexts/drawer/drawer.provider";

const Sidebar = ({ activeMenu }) => {
  const { cardano, ethereum } = useDrawer(); 
  
  const menus = [
    { id: 1, href: "/", title: "Home", iconActive: homeIcon, iconInactive: homeIcon },
    { id: 2, href: "/search", title: "Search", iconActive: searchIcon, iconInactive: searchIcon },
    { id: 3, href: "/create", title: "Create", iconActive: soulsIconActive, iconInactive: soulsIconInactive },
    { id: 4, href: "/mint-claim", title: "Mint or Claim", iconActive: adaSoulsIconActive, iconInactive: adaSoulsIconInactive },
    { id: 5, href: "/wallet", title: "Wallet", iconActive: walletIconActive, iconInactive: walletIconInactive },
    // { id: 6, href: "/settings-profile", title: "Settings", iconActive: settingsIcon, iconInactive: settingsIcon }
    
  ];
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
                <img src={cardano.wallet || ethereum.provider ? item.iconActive : item.iconInactive}></img>
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
