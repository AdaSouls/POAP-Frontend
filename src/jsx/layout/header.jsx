import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Wallet, ChevronUp, ChevronDown, Award, PlusCircle } from "lucide-react";
import logo from "../../images/logo.png";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { useSiteRole, SITE_ROLES } from "../hooks/useSiteRole";
import Tooltip from "../components/Tooltip";

// Horizontal top nav, matching the structure of the poap.xyz reference (logo + nav + a single
// CTA, all in one bar, full-width content below), not just its color scheme.
//
// The nav has a role dropdown (which persona's view you want — Subscriber or Organizer,
// persisted via useSiteRole) plus one or more plain links whose destination/label depend on the
// chosen role. This replaced an earlier "Collector/Organizer" dual-dropdown with grouped page
// links — the role picker now does that grouping job. The dropdown items keep the icon + title +
// description layout the old grouped-links menu used, just describing what each role can do
// instead of where each link goes.
const ROLE_OPTIONS = [
  {
    value: SITE_ROLES.SUBSCRIBER,
    label: "Subscriber",
    icon: Award,
    description: "View and claim subscriptions.",
  },
  {
    value: SITE_ROLES.ORGANIZER,
    label: "Organizer",
    icon: PlusCircle,
    description: "Create events and claim subscriptions.",
  },
];

const ROLE_NAV_ITEMS = {
  [SITE_ROLES.SUBSCRIBER]: [
    { href: "/explore-events", label: "Explore Events" },
    { href: "/my-subscriptions", label: "My Subscriptions" },
  ],
  [SITE_ROLES.ORGANIZER]: [
    { href: "/my-events", label: "My Events" },
  ],
};

const RoleDropdown = ({ role, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const currentLabel = ROLE_OPTIONS.find((option) => option.value === role)?.label ?? "Subscriber";

  const openMenu = () => {
    const rect = toggleRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    // Portaled to <body> (see below) so its backdrop-filter blurs the real page behind it
    // instead of getting trapped inside the header's own already-blurred stacking context — a
    // nested `backdrop-filter` inside another `backdrop-filter`'d ancestor only samples that
    // ancestor's own painted content, not sibling subtrees like the page body, in Chromium's
    // current compositor. Being a portal, the menu is no longer a DOM descendant of the toggle
    // button either, so outside-click detection has to check both refs explicitly.
    const handleClickOutside = (event) => {
      if (
        toggleRef.current && !toggleRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleReposition = () => setOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const selectRole = (value) => {
    onSelect(value);
    setOpen(false);
  };

  return (
    <div className="header-nav-dropdown">
      <button
        type="button"
        ref={toggleRef}
        className={`header-nav-dropdown-toggle header-nav-role-toggle role-${role}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
      >
        <span className="header-nav-dropdown-toggle-inner">
          {currentLabel}
          {open ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
        </span>
      </button>
      {open && menuPos && createPortal(
        <div
          className="header-nav-dropdown-menu"
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`header-nav-dropdown-item${option.value === role ? " active" : ""}`}
              onClick={() => selectRole(option.value)}
            >
              <span className="header-nav-dropdown-item-icon">
                <option.icon size={18} />
              </span>
              <span>
                <span className="header-nav-dropdown-item-title">{option.label}</span>
                <span className="header-nav-dropdown-item-desc">{option.description}</span>
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const Header = () => {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const navigate = useNavigate();
  const [role, setRole] = useSiteRole();
  const roleNavItems = ROLE_NAV_ITEMS[role];

  const showMidnightWallet = () => {
    dispatch({ type: "SHOW_MIDNIGHT_WALLET" });
  };

  // Picking a role from the dropdown lands on that role's informational page (routes match the
  // SITE_ROLES values 1:1: "organizer" -> /organizer, "subscriber" -> /subscriber) in addition to
  // persisting the choice, so switching roles always explains what that role does.
  const handleRoleSelect = (value) => {
    setRole(value);
    navigate(`/${value}`);
  };

  return (
    <div className="header header-horizontal">
      {/* Same `.container` class (and breakpoints) the page content below uses, so the nav's
          inner content lines up exactly with the page instead of running edge-to-edge. */}
      <div className="container">
        <div className="header-content">
          <Link to="/" className="brand-logo">
            <img src={logo} alt="" />
            <span>AdaSouls</span>
          </Link>

          <nav className={`header-nav role-${role}`}>
            <RoleDropdown role={role} onSelect={handleRoleSelect} />
            {roleNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => `header-nav-dropdown-toggle header-nav-role-link${isActive ? " active" : ""}`}
              >
                <span className="header-nav-dropdown-toggle-inner">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <Tooltip label={midnight.provider ? "Wallet connected" : "Connect wallet"}>
            <button
              type="button"
              className={`header-cta header-wallet-btn${midnight.provider ? " header-cta-connected" : ""}`}
              onClick={showMidnightWallet}
              aria-label={midnight.provider ? "Wallet connected" : "Connect wallet"}
            >
              <span className="header-cta-inner header-wallet-btn-inner">
                <Wallet size={18} />
              </span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Header;
