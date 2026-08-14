import React from "react";
import { Link } from "react-router-dom";
import { Calendar, PlusCircle, Check } from "lucide-react";
import Layout from "../layout/layout";

const FEATURES = [
  {
    icon: Calendar,
    title: "Create Events",
    description: "Set up new POAP events with supply limits, expiration, and public or invite-only minting.",
  },
  {
    icon: PlusCircle,
    title: "Push-mint POAPs",
    description: "Mint directly to a wallet — no need for the holder to claim it themselves first.",
  },
  {
    icon: Check,
    title: "Manage attendance",
    description: "Track who claimed a POAP for your events and keep issuer records up to date.",
  },
];

const OrganizerInfo = () => {
  return (
    <Layout>
      <div className="role-info-page role-organizer">
        <div className="row role-hero align-items-center">
          <div className="col-md-6">
            <span className="role-eyebrow">Organizer</span>
            <h1 className="role-hero-title">Create events, issue POAPs, manage attendance</h1>
            <p className="text-muted role-hero-desc">
              As an organizer, you publish events on Midnight and control who can claim a POAP for
              them — including push-minting directly to a wallet that hasn't claimed yet.
            </p>
            <Link to="/my-events" className="btn btn-role-cta">
              Go to My Events
            </Link>
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

export default OrganizerInfo;
