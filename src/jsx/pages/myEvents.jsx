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
import { getAllEvents, getAllDisclosureRequests } from "../../midnight/indexer.service";
import { getPrivateAttributeDraft } from "../../midnight/private-attribute-drafts";
import { getEventStatus } from "../../utils/poapHelpers";

const truncateHex = (hex) => `${hex.slice(0, 8)}…${hex.slice(-6)}`;

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
  const [disclosureRequests, setDisclosureRequests] = useState([]);
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);
  const disclosurePollRef = useRef(null);

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

  // Separate poll, different endpoint — GET /api/disclosure-requests has no eventId filter server-
  // side (see indexer/src/api/routes/disclosures.ts), so this fetches every published request and
  // filters client-side, below, to the ones that are both on one of this organizer's own events AND
  // for a field this browser actually holds a local draft for (see private-attribute-drafts.ts —
  // only the organizer who committed an attribute can ever respond to a question about it).
  const loadDisclosureRequests = useCallback(async () => {
    try {
      const requests = await getAllDisclosureRequests();
      setDisclosureRequests(requests || []);
    } catch (error) {
      console.error("Error loading disclosure requests:", error);
    }
  }, []);

  useEffect(() => {
    loadDisclosureRequests();
    disclosurePollRef.current = setInterval(loadDisclosureRequests, REFRESH_INTERVAL_MS);
    return () => clearInterval(disclosurePollRef.current);
  }, [loadDisclosureRequests]);

  const filteredEvents = useMemo(() => applyFilters(allEvents, filters), [allEvents, filters]);

  // "My Events" is the organizer's own event list — event discovery across everyone else's
  // events already lives on /search, so this stays a strict filter rather than "mine first".
  const ownEvents = useMemo(() => {
    if (!provider) return [];
    return filteredEvents.filter((e) => e.issuerPk === provider.address);
  }, [filteredEvents, provider]);

  // Requests are informational only here, no "Respond" button: the candidate set's actual member
  // values (needed to build the set-membership proof) only ever travel via a share link's query
  // params, never through the indexer (only setRoot, the commitment, is public — see
  // publishDisclosureRequest.jsx). Responding happens at /app/disclosure/respond once the verifier
  // hands over that link out of band.
  const pendingOwnDisclosureRequests = useMemo(() => {
    const ownEventIds = new Set(ownEvents.map((e) => e.eventId));
    return disclosureRequests
      .filter((request) => ownEventIds.has(request.eventId))
      .map((request) => ({ ...request, draft: getPrivateAttributeDraft(request.eventId, request.fieldId) }))
      .filter((request) => request.draft);
  }, [disclosureRequests, ownEvents]);

  // If the expanded event drops out of the (polled/filtered) list, don't leave the grid stuck
  // showing zero cards — fall back to the full grid instead.
  useEffect(() => {
    if (expandedId && !ownEvents.some((e) => e.eventId === expandedId)) {
      setExpandedId(null);
    }
  }, [ownEvents, expandedId]);

  // While one card is expanded, every other card is left out of the grid entirely — each card
  // already carries its own initial/exit animation props, so AnimatePresence fades/scales them
  // away and back in on its own; no separate dimming/hiding logic needed. See eventCard.jsx's own
  // top-of-file comment for why this replaced the old floating-overlay approach.
  const visibleEvents = useMemo(
    () => (expandedId ? ownEvents.filter((e) => e.eventId === expandedId) : ownEvents),
    [ownEvents, expandedId],
  );

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
              <EventFilters filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} role="organizer" />
            </div>
          </div>
        </div>

        {pendingOwnDisclosureRequests.length > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="drawer-modal-preview-card">
                <p className="m-0 small font-weight-semibold mb-2">
                  Pending Disclosure Requests ({pendingOwnDisclosureRequests.length})
                </p>
                {pendingOwnDisclosureRequests.map((request) => (
                  <p className="m-0 small text-muted mb-1" key={request.requestId}>
                    Someone is asking about <span className="text-white">{request.draft.fieldName}</span> on
                    event {truncateHex(request.eventId)} (verifier {truncateHex(request.verifierPk)}) — waiting
                    for them to share the response link with you.
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

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
