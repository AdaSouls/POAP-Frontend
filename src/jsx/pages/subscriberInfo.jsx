import React from "react";
import { Link } from "react-router-dom";
import { Award, ShieldCheck, Share2 } from "lucide-react";
import LandingNav from "../layout/landingNav";
import { useSiteRole, SITE_ROLES } from "../hooks/useSiteRole";

const FEATURES = [
  {
    icon: Award,
    title: "Claim or receive",
    description:
      "Claim an open event's credential yourself, or receive one an organizer issued to you. Both show up automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Prove without revealing",
    description:
      "Answer a verifier's question, like “is it still valid?”, with a yes or no, without showing the details behind it.",
  },
  {
    icon: Share2,
    title: "Share your collection",
    description: "Publish a link to the credentials you choose and keep the rest hidden.",
  },
];

const SubscriberInfo = () => {
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
      <div className="role-info-page role-subscriber">
        <div className="row role-hero align-items-center">
          <div className="col-md-6">
            <span className="role-eyebrow">For people who receive credentials</span>
            <h1 className="role-hero-title">Keep your credentials. Share only what's needed.</h1>
            <p className="text-muted role-hero-desc">
              Claim credentials from events you attend, or receive them straight from an organizer.
              They all appear in one place, and nobody sees your details unless you choose to prove
              something.
            </p>
            <div className="role-hero-cta-group">
              <Link
                to="/app/my-subscriptions"
                className="btn btn-role-cta"
                onClick={() => setRole(SITE_ROLES.SUBSCRIBER)}
              >
                Go to My Subscriptions
              </Link>
            </div>
          </div>
          <div className="col-md-6">
            <div className="role-hero-visual">
              <div className="role-hero-icon">
                <Award size={64} />
              </div>
            </div>
          </div>
        </div>

        <div className="row role-feature-row">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="col-md-4 mb-3 role-feature-card">
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

export default SubscriberInfo;
