import { Link } from "react-router-dom";
import Layout from "./layout";

const menus = [
  { id: 1, href: "settings-profile", title: "Profile" },
  { id: 2, href: "settings-application", title: "Application" },
  { id: 3, href: "settings-security", title: "Security" },
  { id: 4, href: "settings-activity", title: "Activity" },
  { id: 5, href: "settings-privacy", title: "Privacy" },
  { id: 6, href: "settings-payment-method", title: "Payment Method" },
  { id: 7, href: "settings-api", title: "API" },
  { id: 8, href: "settings-fees", title: "Fees" },
];

const SettingsLayout = ({ pageTitle, children, activeMenuID }) => {
  return (
    <Layout activeMenu={5}>
      <div className="row">
        <div className="col-xxl-12">
          <div className="page-title">
            <h4>{pageTitle}</h4>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="settings-menu">
                {menus.map((menus) => (
                  <Link
                    key={menus.id}
                    className={activeMenuID == menus.id ? "active" : ""}
                    to={`/${menus.href}`}
                  >
                    {menus.title}
                  </Link>
                ))}
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default SettingsLayout;
