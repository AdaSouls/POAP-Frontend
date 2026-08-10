import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Award, Info } from "lucide-react";
import Layout from "../layout/layout";

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
  return (
    <Layout>
      <div className="role-info-page role-subscriber">
        <div className="row role-hero align-items-center">
          <div className="col-md-6">
            <span className="role-eyebrow">Subscriber</span>
            <h1 className="role-hero-title">Discover events, claim POAPs, build your collection</h1>
            <p className="text-muted role-hero-desc">
              As a subscriber, you browse events published by organizers and claim POAPs to your
              wallet — your attendance history stays in your own private state.
            </p>
            <div className="role-hero-cta-group">
              <Link to="/my-subscriptions" className="btn btn-role-cta">
                Go to My Subscriptions
              </Link>
              <Link to="/my-pending-approvals" className="btn btn-role-cta btn-role-cta-outline">
                Go to My Pending Approvals
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
    </Layout>
  );
};

export default SubscriberInfo;
