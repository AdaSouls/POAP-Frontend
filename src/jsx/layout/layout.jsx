import { Fragment } from "react";
import Header from "./header";
// `activeMenu` is accepted for backwards compatibility with existing page call sites
// (<Layout activeMenu={N}>) but no longer used — Header derives its active nav link from the
// URL itself (see header.jsx), not this fragile numeric id.
const Layout = ({ children, activeMenu }) => {
  return (
    <Fragment>
      <Header />

      <div className="content-body">
        <div className="container">{children}</div>
      </div>
    </Fragment>
  );
};
export default Layout;
