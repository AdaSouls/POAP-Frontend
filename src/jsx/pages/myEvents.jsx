import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, PlusCircle } from "lucide-react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import EventCard from "../components/eventCard";
import EventFilters from "../components/EventFilters";
import Tooltip from "../components/Tooltip";
import loadingGif from "../../images/loading.gif";
import walletStatus from "../../images/collections/wallet-status.png";
import { getAllEvents } from "../../midnight/indexer.service";
import { getEventStatus } from "../../utils/poapHelpers";

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
    result = result.filter((e) => getEventStatus(e) === filters.status);
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

const MyEvents = () => {
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [filters, setFilters] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);

  // createEvent has no on-chain access gate anymore — any connected wallet can create an event.
  const canCreateEvent = Boolean(provider);

  const createEvent = () => {
    if (!canCreateEvent) return;
    dispatch({ type: "CREATE_EVENT" });
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

  // "My Events" is the organizer's own event list — event discovery across everyone else's
  // events already lives on /search, so this stays a strict filter rather than "mine first".
  const ownEvents = useMemo(() => {
    if (!provider) return [];
    return filteredEvents.filter((e) => e.issuerPk === provider.address);
  }, [filteredEvents, provider]);

  // If the expanded event drops out of the (polled/filtered) list, don't leave the grid stuck
  // showing zero cards — fall back to the full grid instead.
  useEffect(() => {
    if (expandedId && !ownEvents.some((e) => e.eventId === expandedId)) {
      setExpandedId(null);
    }
  }, [ownEvents, expandedId]);

  const visibleEvents = expandedId
    ? ownEvents.filter((e) => e.eventId === expandedId)
    : ownEvents;

  return (
    <Layout activeMenu={3}>
      <div className="role-organizer">
        <div className="inner-header">
          <div className="inner-header-row">
            <div className="inner-header-row-left">
              <span className="badge badge-count-outline">
                {ownEvents.length} {ownEvents.length === 1 ? "Event" : "Events"}
              </span>
            </div>
            <div className="inner-header-row-right">
              {canCreateEvent ? (
                <button className="inner-header-action-btn" onClick={createEvent}>
                  <span className="inner-header-action-btn-inner">
                    <Plus size={14} /> Create Event
                  </span>
                </button>
              ) : (
                <Tooltip label="Connect your wallet to create an event">
                  <button className="inner-header-action-btn is-outline is-inert">
                    <span className="inner-header-action-btn-inner">
                      <Plus size={14} /> Create Event
                    </span>
                  </button>
                </Tooltip>
              )}
              <EventFilters filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} />
            </div>
          </div>
        </div>

        <div className="row">
          {loading ? (
            <div className="wallet-non-connected-page">
              <img src={loadingGif} width="35" height="35" alt="Loading events" />
            </div>
          ) : !provider ? (
            <div className="wallet-non-connected-page">
              <img src={walletStatus} width="150" height="140" alt="" />
            </div>
          ) : ownEvents.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {visibleEvents.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  isExpanded={event.eventId === expandedId}
                  onExpand={() => setExpandedId(event.eventId)}
                  onCollapse={() => setExpandedId(null)}
                />
              ))}
            </AnimatePresence>
          ) : (
            <div className="wallet-non-connected-page">
              <div className="text-center">
                <div className="role-hero-icon mx-auto mb-3">
                  <PlusCircle size={64} />
                </div>
                <h4>No Events Found</h4>
                <p className="text-muted">
                  You haven't organized any events yet. Create your first event to get started!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyEvents;
