import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, Award, CalendarDays, Compass, Plus, PlusCircle } from "lucide-react";
import { useSiteRole, SITE_ROLES } from "../hooks/useSiteRole";
import { getRolePath } from "../hooks/useLastRolePath";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";

// Phone-only app navigation (hidden above 767px in theme-dark-glass.css, where header.jsx keeps
// the role dropdown and page links). The active role's two destinations sit either side of a round
// center button that switches to the other role, landing on that role's last page (or its default,
// see useLastRolePath.js). The bar takes the active role's color. On the /app hub no role is chosen
// yet: the switch is shown disabled in a neutral color, with one role on each side to pick from.
const OTHER_ROLE = {
  [SITE_ROLES.ORGANIZER]: SITE_ROLES.SUBSCRIBER,
  [SITE_ROLES.SUBSCRIBER]: SITE_ROLES.ORGANIZER,
};

const ROLE_LABEL = {
  [SITE_ROLES.ORGANIZER]: "Organizer",
  [SITE_ROLES.SUBSCRIBER]: "Subscriber",
};

const BottomNavLink = ({ to, icon: Icon, label }) => (
  <NavLink to={to} className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}>
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

export default function BottomNav() {
  const [role, setRole] = useSiteRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();

  const pickRole = (value) => {
    setRole(value);
    navigate(getRolePath(value));
  };

  if (location.pathname === "/app") {
    return (
      <nav className="bottom-nav is-hub" aria-label="App navigation">
        <div className="bottom-nav-side">
          <button type="button" className="bottom-nav-item role-organizer" onClick={() => pickRole(SITE_ROLES.ORGANIZER)}>
            <PlusCircle size={20} />
            <span>Organizer</span>
          </button>
        </div>

        <span className="bottom-nav-switch is-disabled" aria-disabled="true">
          <span className="bottom-nav-switch-circle">
            <ArrowLeftRight size={22} />
          </span>
          <span className="bottom-nav-switch-role">Pick a role</span>
        </span>

        <div className="bottom-nav-side">
          <button type="button" className="bottom-nav-item role-subscriber" onClick={() => pickRole(SITE_ROLES.SUBSCRIBER)}>
            <Award size={20} />
            <span>Subscriber</span>
          </button>
        </div>
      </nav>
    );
  }

  const otherRole = OTHER_ROLE[role];
  const switchRole = () => pickRole(otherRole);

  // Same rule as My Events' own Create Event button: it needs a wallet, so without one this opens
  // the wallet popup instead.
  const createEvent = () => {
    dispatch({ type: midnight?.provider ? "CREATE_EVENT" : "SHOW_MIDNIGHT_WALLET" });
  };

  return (
    <nav className={`bottom-nav role-${role}`} aria-label="App navigation">
      <div className="bottom-nav-side">
        {role === SITE_ROLES.ORGANIZER ? (
          <BottomNavLink to="/app/my-events" icon={CalendarDays} label="My Events" />
        ) : (
          <BottomNavLink to="/app/explore-events" icon={Compass} label="Explore" />
        )}
      </div>

      <button
        type="button"
        className="bottom-nav-switch"
        onClick={switchRole}
        aria-label={`Switch to ${ROLE_LABEL[otherRole]}`}
      >
        <span className="bottom-nav-switch-circle">
          <ArrowLeftRight size={22} />
        </span>
        <span className="bottom-nav-switch-role">{ROLE_LABEL[role]}</span>
      </button>

      <div className="bottom-nav-side">
        {role === SITE_ROLES.ORGANIZER ? (
          <button type="button" className="bottom-nav-item" onClick={createEvent}>
            <Plus size={20} />
            <span>Create</span>
          </button>
        ) : (
          <BottomNavLink to="/app/my-subscriptions" icon={Award} label="My Subs" />
        )}
      </div>
    </nav>
  );
}
