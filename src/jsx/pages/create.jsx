import { useEffect, useState, useCallback, useRef } from "react";
import Layout from "../layout/layout";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import collectionMenu from "../../icons/svg/collection-menu.svg";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import PoapEvents from "../components/poapEvents";
import { getAllEvents } from "../../midnight/indexer.service";
import { informationFunction } from "../toasts/sweetAlerts";

const REFRESH_INTERVAL_MS = 5000;

const Create = () => {
  const [addressEvents, setAddressEvents] = useState([]);
  const { midnight: { provider } } = useDrawer();
  const { isAdmin, isIssuer } = useUserRoles();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);

  const createEvent = () => {
    if (!provider) return;
    if (!isAdmin && !isIssuer) {
      informationFunction(
        "Organizer Access Required",
        "Registering event organizers is admin-only on this contract. Contact the AdaSouls admin to be added as an organizer."
      );
      return;
    }
    dispatch({ type: "CREATE_EVENT" });
  };

  const showMidnightWallet = () => {
    dispatch({ type: "SHOW_MIDNIGHT_WALLET" });
  };

  const loadMyEvents = useCallback(async () => {
    if (!provider) {
      setAddressEvents([]);
      return;
    }
    try {
      const events = await getAllEvents();
      setAddressEvents(events.filter((e) => e.issuerPk === provider.address));
    } catch (error) {
      console.error("Error loading events:", error);
    }
  }, [provider]);

  useEffect(() => {
    loadMyEvents();
    pollRef.current = setInterval(loadMyEvents, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadMyEvents]);

  return (
    <Layout activeMenu={2}>
      <div className="inner-header">
        <div className="inner-header-row">
          <div className="inner-header-row-left">
            <h4>POAP Event Creation</h4>
          </div>
          <div className="inner-header-row-right">
            <button
              className={`inner-header-action-btn${!provider ? " is-outline" : ""}`}
              onClick={!provider ? showMidnightWallet : createEvent}
              title={!provider ? "Connect your wallet to create an event" : isAdmin || isIssuer ? "Create a new event" : "Organizer access required"}
            >
              <span className="inner-header-action-btn-inner">
                <Plus size={14} /> Create POAP Event
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card card-outline-only">
            <div className="card-outline-only-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <p className="m-0 small text-muted">My Events</p>
                {provider && (
                  <Link to={"/events"} className="btn btn-gradient-purple btn-icon rounded-lg">
                    <img className="p-1" src={collectionMenu} width="35" height="35" alt="" />
                  </Link>
                )}
              </div>
              <div className="table-responsive" style={{ maxHeight: 340, overflowY: "auto" }}>
                <PoapEvents addressEvents={addressEvents} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Create;
