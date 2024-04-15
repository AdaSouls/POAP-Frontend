import { Fragment } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
const Layout = ({ children, activeMenu }) => {
  return (
    <Fragment>
      <Header />
      <Sidebar activeMenu={activeMenu} />

      <div className="content-body">
        <div className="container">{children}</div>
      </div>
    </Fragment>
  );
};
export default Layout;
