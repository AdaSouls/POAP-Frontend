import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Compass, Award } from "lucide-react";
import Layout from "../layout/layout";
import { useSiteRole, SITE_ROLES } from "../hooks/useSiteRole";

// Central hub at /app, reached directly (bookmark, typed URL) or from the launcher's "Go to App".
// Deliberately does NOT auto-redirect to a remembered page: it asks which role you're using right
// now. The text names both roles in their colors, and each page is an outline badge in its role's
// color; clicking one sets the role and goes straight to that page.
const ROLE_GROUPS = [
  {
    role: SITE_ROLES.ORGANIZER,
    pages: [{ to: "/app/my-events", label: "My Events", icon: PlusCircle }],
  },
  {
    role: SITE_ROLES.SUBSCRIBER,
    pages: [
      { to: "/app/explore-events", label: "Explore Events", icon: Compass },
      { to: "/app/my-subscriptions", label: "My Subscriptions", icon: Award },
    ],
  },
];

const AppHome = () => {
  const [, setRole] = useSiteRole();

  return (
    <Layout>
      <div className="app-home-section">
        <h4 className="app-home-title">Select a role</h4>
        <p className="text-muted app-home-subtitle">
          As an <span className="app-home-role role-organizer">Organizer</span> you create events and
          issue credentials. As a <span className="app-home-role role-subscriber">Subscriber</span>{" "}
          you explore events and collect your credentials. You can switch any time from the menu.
        </p>

        <div className="app-hub-badges">
          {ROLE_GROUPS.flatMap(({ role, pages }) =>
            pages.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={`app-hub-badge role-${role}`} onClick={() => setRole(role)}>
                <Icon size={16} />
                {label}
              </Link>
            )),
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AppHome;
