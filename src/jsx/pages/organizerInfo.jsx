import React from "react";
import { Link } from "react-router-dom";
import { Layers, PlusCircle, QrCode, Lock, ShieldCheck } from "lucide-react";
import LandingNav from "../layout/landingNav";
import { useSiteRole, SITE_ROLES } from "../hooks/useSiteRole";

const FEATURES = [
  {
    icon: Layers,
    title: "Three kinds of credentials",
    description:
      "Events for attendance, Subscriptions for memberships, and Credentials for certificates or documents issued one by one.",
  },
  {
    icon: QrCode,
    title: "Invite with a link or QR",
    description:
      "For open events, people claim it themselves. For the rest, they send you a link back and you issue it in one click. No keys to copy.",
  },
  {
    icon: Lock,
    title: "Private details",
    description:
      "Add fields like a grade, an ID number or an expiry date. They're sent encrypted to the holder; only a fingerprint is stored publicly.",
  },
  {
    icon: ShieldCheck,
    title: "Verify and revoke",
    description: "Ask holders to prove something about their credential, and revoke one issued by mistake.",
  },
];

const OrganizerInfo = () => {
  const [, setRole] = useSiteRole();

  return (
    <div className="landing-page">
      <LandingNav />
      {/* role-scroll-body cancels .content-body's own padding-top:68px (theme-dark-glass.css) so
          this page's content renders behind the now-transparent .landing-nav instead of starting
          below it — .role-hero's own top padding was bumped to compensate, giving clearance past
          the nav instead of relying on this div's padding for it. */}
      <div className="content-body role-scroll-body">
      <div className="container">
      <div className="role-info-page role-organizer">
        <div className="row role-hero align-items-center">
          <div className="col-md-6">
            <span className="role-eyebrow">For organizers</span>
            <h1 className="role-hero-title">Create, issue and verify credentials</h1>
            <p className="text-muted role-hero-desc">
              Run events, courses or memberships and give each person a credential they can prove.
              You decide who receives one and which details stay private.
            </p>
            <Link
              to="/app/my-events"
              className="btn btn-role-cta"
              onClick={() => setRole(SITE_ROLES.ORGANIZER)}
            >
              Create your first event
            </Link>
            <p className="text-muted small role-hero-note">You'll need a Midnight wallet (Lace or 1AM).</p>
          </div>
          <div className="col-md-6">
            <div className="role-hero-visual">
              <div className="role-hero-icon">
                <PlusCircle size={64} />
              </div>
            </div>
          </div>
        </div>

        <div className="row role-feature-row">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="col-md-6 col-lg-3 mb-3 role-feature-card">
              <div className="role-feature-icon">
                <Icon size={22} />
              </div>
              <h5>{title}</h5>
              <p className="text-muted small">{description}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default OrganizerInfo;
