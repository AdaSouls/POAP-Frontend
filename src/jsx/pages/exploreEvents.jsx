import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import EventCard from "../components/eventCard";
import EventFilters from "../components/EventFilters";
import loadingGif from "../../images/loading.gif";
import walletStatus from "../../images/collections/wallet-status.png";
import { getAllEvents } from "../../midnight/indexer.service";
import { getMyTokens } from "../../midnight/my-tokens";
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

// The self-claim counterpart to myEvents.jsx's own-events list: browse OTHER organizers' public
// events and self-claim (claim(), via the existing createPoap.jsx drawer) into one — not to
// be confused with mintPoap.jsx's organizer push-mint (mintTo), which is a separate flow this page
// never touches.
const ExploreEvents = () => {
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [filters, setFilters] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);

  const handleClaim = (event) => {
    dispatch({ type: "CREATE_POAP", payload: event });
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

  const otherEvents = useMemo(() => {
    if (!provider) return [];
    return filteredEvents.filter((e) => e.isPublicMint && e.issuerPk !== provider.address);
  }, [filteredEvents, provider]);

  // Which of these events the connected wallet already holds a (non-burned) token for — computed
  // once for the whole list (deduped by issuer, see getMyTokens) rather than per-card, so both the
  // collapsed tile and expanded card can show "Followed"/"Attended"/"Subscribed" instead of the
  // plain event status, and the claim button can be disabled, without every card in the grid firing
  // its own holder-pk-derivation + indexer round trip. subscriptionsLoading only ever flips
  // true→false once (first load), same pattern as `loading` above — later polls refresh myTokens
  // silently in the background instead of flashing every card back to "unknown" every 5s.
  const [myTokens, setMyTokens] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);

  useEffect(() => {
    if (!provider || otherEvents.length === 0) {
      setMyTokens([]);
      setSubscriptionsLoading(false);
      return undefined;
    }
    let cancelled = false;
    getMyTokens(provider.service, otherEvents, {})
      .then((tokens) => {
        if (!cancelled) setMyTokens(tokens);
      })
      .catch((error) => {
        console.error("Error checking existing subscriptions:", error);
      })
      .finally(() => {
        if (!cancelled) setSubscriptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, otherEvents]);

  const mySubscribedEventIds = useMemo(
    () => new Set(myTokens.filter((token) => !token.isBurned).map((token) => token.firstEventId)),
    [myTokens],
  );

  // If the expanded event drops out of the (polled/filtered) list, don't leave the grid stuck
  // showing zero cards — fall back to the full grid instead.
  useEffect(() => {
    if (expandedId && !otherEvents.some((e) => e.eventId === expandedId)) {
      setExpandedId(null);
    }
  }, [otherEvents, expandedId]);

  // While one card is expanded, every other card is left out of the grid entirely — each card
  // already carries its own initial/exit animation props, so AnimatePresence fades/scales them
  // away and back in on its own; no separate dimming/hiding logic needed. See eventCard.jsx's own
  // top-of-file comment for why this replaced the old floating-overlay approach.
  const visibleEvents = useMemo(
    () => (expandedId ? otherEvents.filter((e) => e.eventId === expandedId) : otherEvents),
    [otherEvents, expandedId],
  );

  return (
    <Layout activeMenu={3}>
      <div className="role-subscriber">
        <div className="inner-header">
          <div className="inner-header-row">
            <div className="inner-header-row-left">
              <span className="badge badge-count-outline">
                {otherEvents.length} {otherEvents.length === 1 ? "Event" : "Events"}
              </span>
            </div>
            <div className="inner-header-row-right">
              <EventFilters filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} role="subscriber" />
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
          ) : otherEvents.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {visibleEvents.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  isExpanded={event.eventId === expandedId}
                  onExpand={() => setExpandedId(event.eventId)}
                  onCollapse={() => setExpandedId(null)}
                  variant="explore"
                  onClaim={handleClaim}
                  isSubscribed={mySubscribedEventIds.has(event.eventId)}
                  subscriptionLoading={subscriptionsLoading}
                />
              ))}
            </AnimatePresence>
          ) : (
            <div className="wallet-non-connected-page">
              <div className="text-center">
                <div className="role-hero-icon mx-auto mb-3">
                  <Compass size={64} />
                </div>
                <h4>No Public Events Found</h4>
                <p className="text-muted">
                  Public events from other organizers will show up here once they're created.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExploreEvents;
