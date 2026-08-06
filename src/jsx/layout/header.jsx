import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Calendar, Award, Wallet, PlusCircle, LayoutDashboard, ChevronUp, ChevronDown } from "lucide-react";
import logo from "../../images/logo.png";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";

// Horizontal top nav, replacing the old vertical sidebar entirely — matches the structure of
// the poap.xyz reference (logo + nav + a single CTA, all in one bar, full-width content below),
// not just its color scheme. Nav items are grouped into role-based dropdowns (Collector /
// Organizer), the same spirit as poap.xyz's own audience-based grouping (About/Issuers/
// Collectors/Builders), confirmed with the user rather than assumed.
const DROPDOWNS = [
  {
    label: "Collector",
    items: [
      { href: "/events", title: "Events", description: "Browse events published on-chain.", icon: Calendar },
      { href: "/poap-management", title: "My POAPs", description: "View and claim your token collection.", icon: Award },
      { href: "/wallet", title: "Wallet", description: "Connect and manage your Lace wallet.", icon: Wallet },
    ],
  },
  {
    label: "Organizer",
    items: [
      { href: "/create", title: "Create Event", description: "Publish a new event for attendees to claim.", icon: PlusCircle },
      { href: "/organizer-dashboard", title: "Organizer Dashboard", description: "See stats across your events.", icon: LayoutDashboard },
    ],
  },
];

const NavDropdown = ({ label, items }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const location = useLocation();
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const isActive = items.some((item) => item.href === location.pathname);

  const openMenu = () => {
    const rect = toggleRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    // The menu is portaled to <body> (see below) so its backdrop-filter blurs the real page
    // behind it instead of getting trapped inside the header's own already-blurred stacking
    // context — a nested `backdrop-filter` inside another `backdrop-filter`'d ancestor only
    // samples that ancestor's own painted content, not sibling subtrees like the page body, in
    // Chromium's current compositor. Being a portal, the menu is no longer a DOM descendant of
    // the toggle button either, so outside-click detection has to check both refs explicitly.
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

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="header-nav-dropdown">
      <button
        type="button"
        ref={toggleRef}
        className={`header-nav-dropdown-toggle${isActive ? " active" : ""}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
      >
        <span className="header-nav-dropdown-toggle-inner">
          {label}
          {open ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
        </span>
      </button>
      {open && menuPos && createPortal(
        <div
          className="header-nav-dropdown-menu"
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {items.map((item) => (
            <NavLink key={item.href} to={item.href} className="header-nav-dropdown-item">
              <span className="header-nav-dropdown-item-icon">
                <item.icon size={18} />
              </span>
              <span>
                <span className="header-nav-dropdown-item-title">{item.title}</span>
                <span className="header-nav-dropdown-item-desc">{item.description}</span>
              </span>
            </NavLink>
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

  const showMidnightWallet = () => {
    dispatch({ type: "SHOW_MIDNIGHT_WALLET" });
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

          <nav className="header-nav">
            {DROPDOWNS.map((dropdown) => (
              <NavDropdown key={dropdown.label} {...dropdown} />
            ))}
          </nav>

          {midnight.provider ? (
            <Link to="/wallet" className="header-cta header-cta-connected">
              <span className="header-cta-inner">Wallet</span>
            </Link>
          ) : (
            <button className="header-cta" onClick={showMidnightWallet}>
              <span className="header-cta-inner">Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
