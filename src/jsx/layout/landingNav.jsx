import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, PlusCircle, Award } from "lucide-react";
import logo from "../../images/logo.png";
import Tooltip from "../components/Tooltip";

// "Roles" nav item: a lightweight, non-portaled dropdown (this nav has no backdrop-filter of its
// own — see .landing-nav in theme-dark-glass.css — so unlike header.jsx's RoleDropdown there's no
// nested-blur compositing issue to work around here). Purely two static links to the role info
// pages — deliberately does NOT touch useSiteRole/localStorage. Picking a role here is just
// navigation ("go read about this role"), not a persisted preference; that only happens inside the
// app itself (header.jsx's own role dropdown).
const LandingRolesDropdown = () => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="landing-nav-dropdown" ref={wrapRef}>
      <button
        type="button"
        className="landing-nav-link landing-nav-dropdown-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Roles
        <ChevronDown size={14} className="ml-1" />
      </button>
      {open && (
        <div className="landing-nav-dropdown-menu">
          <Link to="/organizer" className="landing-nav-dropdown-item" onClick={() => setOpen(false)}>
            <PlusCircle size={16} />
            <span>Organizer</span>
          </Link>
          <Link to="/subscriber" className="landing-nav-dropdown-item" onClick={() => setOpen(false)}>
            <Award size={16} />
            <span>Subscriber</span>
          </Link>
        </div>
      )}
    </div>
  );
};

// Shared nav for every landing-side page (/, /organizer, /subscriber) — deliberately not the app's
// own Header (header.jsx): no wallet button, no persisted-role dropdown, no my-events/explore-
// events/my-subscriptions links. Used identically by all three pages so switching roles from
// /organizer or /subscriber never surfaces app-only nav items or touches the site-role preference.
const LandingNav = () => (
  <div className="landing-nav">
    <div className="container">
      <div className="landing-nav-content">
        <Link to="/" className="brand-logo landing-nav-brand">
          <img src={logo} alt="" />
          <span>AdaSouls</span>
        </Link>

        <nav className="landing-nav-links">
          <Tooltip label="Próximamente">
            <span className="landing-nav-link landing-nav-link-disabled" aria-disabled="true">
              Documentación
            </span>
          </Tooltip>
          <LandingRolesDropdown />
        </nav>

        <Link to="/app" className="btn btn-dual-cta">
          Get Started
        </Link>
      </div>
    </div>
  </div>
);

export default LandingNav;
