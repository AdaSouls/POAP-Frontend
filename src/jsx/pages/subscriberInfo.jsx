import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Award, Info } from "lucide-react";
import LandingNav from "../layout/landingNav";
import { useSiteRole, SITE_ROLES } from "../hooks/useSiteRole";

const FEATURES = [
  {
    icon: Calendar,
    title: "Browse Events",
    description: "Explore events published on-chain by registered organizers.",
  },
  {
    icon: Award,
    title: "Claim your POAP",
    description: "Mint your token — repeat claims update your existing token's attendance instead of duplicating it.",
  },
  {
    icon: Info,
    title: "Track pending approvals",
    description: "See claims waiting on an organizer, in one place.",
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
            <span className="role-eyebrow">Subscriber</span>
            <h1 className="role-hero-title">Discover events, claim POAPs, build your collection</h1>
            <p className="text-muted role-hero-desc">
              As a subscriber, you browse events published by organizers and claim POAPs to your
              wallet. Tokens an organizer mints directly to you show up here automatically too —
              no separate approval step.
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
