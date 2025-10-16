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
import poapIconActive from "../../icons/svg/poap-active.svg";
import poapIconInactive from "../../icons/svg/poap-inactive.svg";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import collectionOwnerIconActive from "../../icons/svg/collection-owner.svg";
import collectionOwnerIconInactive from "../../icons/svg/collection-owner.svg";
import collectionInvitedIconActive from "../../icons/svg/collection-invited.svg";
import collectionInvitedIconInactive from "../../icons/svg/collection-invited.svg";
import manageUsersIconActive from "../../icons/svg/collection-multisig.svg";

const Sidebar = ({ activeMenu }) => {
  const { cardano, ethereum } = useDrawer(); 
  const { userRoles, isInitialized } = useUserRoles();

  const getMenus = () => {
    const baseMenus = [
      { id: 1, href: "/", title: "Home", iconActive: homeIcon, iconInactive: homeIcon },
      { id: 9, href: "/mvp", title: "POAP", iconActive: poapIconActive, iconInactive: poapIconInactive },
      { id: 5, href: "/wallet", title: "Wallet", iconActive: walletIconActive, iconInactive: walletIconInactive },
    ];

    if (isInitialized && ethereum && ethereum.provider) {
      // Show organizer menus if user has organizer role
      if (userRoles.includes('organizer')) {
        baseMenus.push(
          { id: 10, href: "/mvp/organizer", title: "My Events", iconActive: collectionOwnerIconActive, iconInactive: collectionOwnerIconInactive },
          { id: 11, href: "/mvp/manage-minters", title: "Manage Minters", iconActive: manageUsersIconActive, iconInactive: manageUsersIconActive },
          // { id: 12, href: "/mvp/bulk-distribute", title: "Bulk Distribute", iconActive: adaSoulsIconActive, iconInactive: poapIconInactive }
        );
      }
      
      // Show attendee menus if user has attendee role
      if (userRoles.includes('attendee')) {
        baseMenus.push(
          { id: 13, href: "/mvp/attendee", title: "My Participation", iconActive: collectionInvitedIconActive, iconInactive: collectionInvitedIconInactive }
        );
      }
    }

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
                <img src={cardano.wallet || ethereum.provider ? item.iconActive : item.iconInactive} ></img>
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