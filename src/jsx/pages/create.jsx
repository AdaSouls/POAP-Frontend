import { useEffect, useState, useCallback, useRef } from "react";
import Layout from "../layout/layout";
import { Link } from "react-router-dom";
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
      <div className="row">
        <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
          <div className="card inner-header">
            <div className="d-flex justify-content-center m-3">
              <div className="inner-header-title">
                <h4>POAP EVENT CREATION</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
          <div className="card card-create bg-poap card-classic">
            <div className="card-body card-classic-max-height" onClick={provider ? createEvent : undefined}>
              <h4>CREATE <span> POAP EVENT</span></h4>
              <div className={(provider ? "plus-button" : "axis-button") + " align-content-center"}>
                <div></div>
                <div></div>
              </div>
            </div>
            <div className="d-flex justify-content-between m-3">
              <div className="align-content-center mt-4">
                <span className={isAdmin || isIssuer ? "verified" : "not-verified"}>
                  <i className={isAdmin || isIssuer ? "icofont-check-alt" : "icofont-close-line"}></i>
                </span>
              </div>
              <div className="align-content-center mt-4">
                {!provider && (
                  <button className="btn btn-white btn-small" onClick={showMidnightWallet}>
                    Connect
                  </button>
                )}
                {provider && (
                  <button className="btn btn-danger btn-small" onClick={showMidnightWallet}>
                    Change Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-9 col-xl-9 col-lg-8 col-md-7">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">My Events</h4>
              {provider && (
                <span>
                  <Link to={"/events"} className="btn btn-gradient-purple btn-icon rounded-lg">
                    <img className="p-1" src={collectionMenu} width="35" height="35" alt="" />
                  </Link>
                </span>
              )}
            </div>
            <div className="card-body card-classic-max-height-title" style={{ overflow: "hidden", overflowY: "auto" }}>
              <div className="table-responsive">
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
