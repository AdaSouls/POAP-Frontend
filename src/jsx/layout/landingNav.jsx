import React from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import logo from "../../images/logo.png";

// Shared nav for every landing-side page (/, /organizer, /subscriber) — deliberately not the app's
// own Header (header.jsx): no wallet button, no persisted-role dropdown, no my-events/explore-
// events/my-subscriptions links. Used identically by all three pages. The role pages are reached
// from the hero's two role buttons (index.jsx), not from the nav.
const LandingNav = () => (
  <div className="landing-nav">
    <div className="container">
      <div className="landing-nav-content">
        <Link to="/" className="brand-logo landing-nav-brand">
          <img src={logo} alt="" />
          <span>Velum</span>
        </Link>

        <nav className="landing-nav-links">
          {/* Text on wider screens; on phones only the icon shows (theme-dark-glass.css). */}
          <Link to="/docs" className="landing-nav-link landing-nav-docs" aria-label="Documentation">
            <BookOpen size={18} className="landing-nav-docs-icon" aria-hidden="true" />
            <span className="landing-nav-docs-label">Documentation</span>
          </Link>
          <Link to="/app" className="btn btn-dual-cta btn-glow-border btn-glow-hover">
            <span className="btn-glow-fill" aria-hidden="true" />
            <span className="btn-glow-label">Go to App</span>
          </Link>
        </nav>
      </div>
    </div>
  </div>
);

export default LandingNav;
