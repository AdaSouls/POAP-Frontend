import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Award } from "lucide-react";
import Layout from "../layout/layout";
import { useSiteRole, SITE_ROLES } from "../hooks/useSiteRole";
import { useLastRolePath, DEFAULT_ROLE_PATH } from "../hooks/useLastRolePath";

// Central hub at /app — reached directly (bookmark, typed URL) or via the landing's "Get Started".
// Deliberately does NOT auto-redirect to a remembered page (router.jsx used to do that): always
// asks which role you're using right now, then commits to it. Each card's destination is still the
// remembered last page for that role (or its default) — see useLastRolePath.js — so the "pick up
// where I left off" behavior survives, it's just one explicit click away instead of automatic.
//
// Deliberately NOT the landing's .index-role-plain treatment (bare icon, no card, separate CTA
// button below) — per explicit feedback this page read as a near-duplicate of the landing. Each
// role is instead one whole clickable square card (app.card-outline-only's glass/border language,
// same family as every other card in the app — poapCard.jsx/eventCard.jsx), icon+name+description
// all inside it, no separate button.
const AppHome = () => {
  const [, setRole] = useSiteRole();
  const [lastRolePath] = useLastRolePath();
  const organizerTarget = lastRolePath[SITE_ROLES.ORGANIZER] || DEFAULT_ROLE_PATH[SITE_ROLES.ORGANIZER];
  const subscriberTarget = lastRolePath[SITE_ROLES.SUBSCRIBER] || DEFAULT_ROLE_PATH[SITE_ROLES.SUBSCRIBER];

  return (
    <Layout>
      <div className="app-home-section">
        <h4 className="app-home-title">Select Role</h4>

        <div className="app-role-card-grid">
          <Link
            to={organizerTarget}
            className="app-role-card role-organizer"
            onClick={() => setRole(SITE_ROLES.ORGANIZER)}
          >
            <PlusCircle size={56} className="app-role-card-icon" />
            <h5 className="app-role-card-title">Organizer</h5>
            <p className="text-muted small app-role-card-desc">
              Create events, issue POAPs, and manage attendance.
            </p>
          </Link>
          <Link
            to={subscriberTarget}
            className="app-role-card role-subscriber"
            onClick={() => setRole(SITE_ROLES.SUBSCRIBER)}
          >
            <Award size={56} className="app-role-card-icon" />
            <h5 className="app-role-card-title">Subscriber</h5>
            <p className="text-muted small app-role-card-desc">
              Discover events, claim POAPs, and build your collection.
            </p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AppHome;
