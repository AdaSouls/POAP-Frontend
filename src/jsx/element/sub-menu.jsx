import React from "react";
import { Link } from "react-router-dom";

const SubMenu = () => {
  return (
    <div className="settings-menu">
      <Link to={"/settings-profile"}>Profile</Link>
      <Link to={"/settings-application"}>Application</Link>
      <Link to={"/settings-security"}>Security</Link>
      <Link to={"/settings-activity"}>Activity</Link>
      <Link to={"/settings-privacy"}>Privacy</Link>
      <Link to={"/settings-payment-method"}>Payment Method</Link>
      <Link to={"/settings-api"}>API</Link>
      <Link to={"/settings-fees"}>Fees</Link>
    </div>
  );
};

export default SubMenu;
