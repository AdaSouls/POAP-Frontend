import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import EventCard from "../components/eventCard";
import EventFilters from "../components/EventFilters";
import loadingGif from "../../images/loading.gif";
import walletStatus from "../../images/collections/wallet-status.png";
import { getAllEvents } from "../../midnight/indexer.service";

const REFRESH_INTERVAL_MS = 5000;

function applyFilters(events, filters) {
  let result = [...events];

  if (filters.eventIdSearch) {
    result = result.filter((e) => e.eventId.toLowerCase().includes(filters.eventIdSearch.toLowerCase()));
  }
  if (filters.issuerSearch) {
    result = result.filter((e) => e.issuerPk.toLowerCase().includes(filters.issuerSearch.toLowerCase()));
  }
  if (filters.status) {
    result = result.filter((e) => {
      const isExpired = e.expiration > 0 && e.expiration * 1000 <= Date.now();
      const isFull = e.maxSupply > 0 && e.minted >= e.maxSupply;
      const status = !e.isActive ? "inactive" : isExpired ? "expired" : isFull ? "full" : "active";
      return status === filters.status;
    });
  }
  if (filters.maxSupplyMin !== undefined) {
    result = result.filter((e) => e.maxSupply >= filters.maxSupplyMin);
  }
  if (filters.maxSupplyMax !== undefined) {
    result = result.filter((e) => e.maxSupply <= filters.maxSupplyMax);
  }

  const sortBy = filters.sortBy || "createdBlock";
  const order = filters.order || "desc";
  result.sort((a, b) => {
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    return order === "asc" ? av - bv : bv - av;
  });

  return result;
}

const EventsPage = () => {
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [filters, setFilters] = useState({});
  const { midnight: { provider } } = useDrawer();
  const { isAdmin, isIssuer } = useUserRoles();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);

  const canCreateEvent = isAdmin || isIssuer;

  const createEvent = () => {
    if (!canCreateEvent) return;
    dispatch({ type: "CREATE_EVENT" });
  };

  const showMidnightWallet = () => {
    dispatch({ type: "SHOW_MIDNIGHT_WALLET" });
  };

  const loadEvents = useCallback(async () => {
    try {
      const events = await getAllEvents();
      setAllEvents(events);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    pollRef.current = setInterval(loadEvents, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadEvents]);

  const filteredEvents = useMemo(() => applyFilters(allEvents, filters), [allEvents, filters]);

  const myEvents = useMemo(() => {
    if (!provider) return [];
    return filteredEvents.filter((e) => e.issuerPk === provider.address);
  }, [filteredEvents, provider]);

  const otherEvents = useMemo(
    () => filteredEvents.filter((e) => !myEvents.some((mine) => mine.eventId === e.eventId)),
    [filteredEvents, myEvents]
  );

  return (
    <Layout activeMenu={3}>
      <>
        <div className="row">
          <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
            <div className="card inner-header">
              <div className="d-flex justify-content-between m-3">
                <div className="inner-header-back">
                  <Link to="/create" className="simple-link">
                    <i className="icofont-rounded-left"></i>
                  </Link>
                </div>
                <div className="inner-header-title">
                  <h4>Events</h4>
                </div>
                <div className="inner-header-buttons">
                  <span className="badge bg-primary">
                    {filteredEvents.length} {filteredEvents.length === 1 ? "Event" : "Events"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <EventFilters filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} />
          </div>
        </div>

        <div className="row">
          <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card card-create bg-event card-classic">
              <div className="card-body card-classic-max-height" onClick={createEvent}>
                <h4>CREATE <span> EVENT</span></h4>
                <div className={(canCreateEvent ? "plus-button" : "axis-button") + " align-content-center"}>
                  <div></div><div></div>
                </div>
              </div>
              <div className="d-flex justify-content-between m-3">
                <div className="align-content-center mt-4">
                  <span className="verified">
                    {canCreateEvent ? <i className="icofont-check-alt"></i> : <i className="icofont-close-line"></i>}
                  </span>
                </div>
                <div className="align-content-center mt-4">
                  {!provider && (
                    <button className="btn btn-white btn-small" onClick={showMidnightWallet}>
                      Connect
                    </button>
                  )}
                  {provider && !canCreateEvent && (
                    <small className="text-muted">Organizer access required</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
              <div className="card card-event card-classic">
                <div className="card-body card-classic-max-height d-flex justify-content-center">
                  <div className="loading-event-card">
                    <img src={loadingGif} width="35" height="35" alt="" />
                  </div>
                </div>
              </div>
            </div>
          ) : filteredEvents.length > 0 ? (
            <>
              {myEvents.map((event) => (
                <EventCard key={`my-${event.eventId}`} event={event} />
              ))}
              {otherEvents.map((event) => (
                <EventCard key={event.eventId} event={event} />
              ))}
            </>
          ) : (
            <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
              <div className="card card-event card-classic">
                <div className="wallet-non-connected">
                  <img className="mt-6" src={walletStatus} width="150" height="140" alt="" />
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    </Layout>
  );
};

export default EventsPage;
