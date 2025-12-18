import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import EventCard from "../components/eventCard";
import EventFilters from "../components/EventFilters";
import eventNormal from "../../images/svg/event-normal.svg";
import loadingGif from "../../images/loading.gif";
import walletStatus from "../../images/collections/wallet-status.png";
import dataSyncService from "../../services/dataSync.service";
import { getAllEvents } from "../../services/event.service";

const EventsPage = () => { 
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [filters, setFilters] = useState({});
  const { poapEvents, ethereum: { provider, address } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createEvent = () => {
    dispatch({
      type: 'CREATE_EVENT'
    });
  };

  const updateEvents = (events) => {
    dispatch({
      type: "UPDATE_EVENTS",
      payload: events,
    });
  };

  const loadEvents = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      const finalFilters = { ...filterParams };

      const fetchedEvents = await getAllEvents(finalFilters);
      setEvents(fetchedEvents);
      
      // Also update context for other components
      dispatch({
        type: "UPDATE_EVENTS",
        payload: fetchedEvents,
      });

      // Separate my events for display
      if (provider && address) {
        const userEvents = fetchedEvents.filter(event => 
          event.organiserAddress?.toLowerCase() === address.toLowerCase()
        );
        setMyEvents(userEvents);
      } else {
        setMyEvents([]);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      // Fallback to context events if API fails
      if (poapEvents && poapEvents.length > 0) {
        setEvents(poapEvents);
        if (provider && address) {
          const userEvents = poapEvents.filter(event => 
            event.organiserAddress?.toLowerCase() === address.toLowerCase()
          );
          setMyEvents(userEvents);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [provider, address, poapEvents, dispatch]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    loadEvents(newFilters);
  }, [loadEvents]);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    loadEvents({});
  }, [loadEvents]);

  useEffect(() => {
    // Initial load
    loadEvents({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Keep context events as fallback
  useEffect(() => {
    if (!loading && events.length === 0 && poapEvents && poapEvents.length > 0) {
      setEvents(poapEvents);
      if (provider && address) {
        const userEvents = poapEvents.filter(event => 
          event.organiserAddress?.toLowerCase() === address.toLowerCase()
        );
        setMyEvents(userEvents);
      }
    }
  }, [poapEvents, provider, address, loading, events.length]);

  // Polling for real-time events data
  useEffect(() => {
    if (provider && provider.address) {
      // Start polling when events page loads
      dataSyncService.startEventsPolling(updateEvents, 5000);
    }

    // Cleanup when leaving events page
    return () => {
      dataSyncService.stopEventsPolling();
    };
  }, [provider]);

  return (
    <Layout activeMenu={3}>
      <>
        <div className="row">
          {/* HEADER */}
          <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
            <div className="card inner-header">
              <div className="d-flex justify-content-between m-3">
                <div className="inner-header-back">
                  <Link to="/create" className="simple-link">
                    <i className="icofont-rounded-left"></i>   
                  </Link>                            
                </div>
                <div className="inner-header-title">
                  <h4>
                    <span className="text-uppercase"></span>
                    Events
                  </h4>
                </div>
                <div className="inner-header-buttons">
                  <span className="badge bg-primary">
                    {events.length} {events.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="row">
          <div className="col-12">
            <EventFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        <div className="row">
          {/* CREATE EVENT CARD */}
          <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card card-create bg-event card-classic">
              <div className="card-body card-classic-max-height" onClick={provider ? createEvent : console.log("alert! wallet connect")}>
                <h4>CREATE <span> EVENT</span></h4>               
                <div className={(provider ? "plus-button" : "axis-button")+" align-content-center"} >
                  <div></div><div></div>
                </div>              
              </div>
              <div className="d-flex justify-content-between m-3">
                <div className="align-content-center mt-4">                    
                  <span className="verified">
                    {provider && <i className="icofont-check-alt"></i>}
                    {!provider && <i className="icofont-close-line"></i>}
                  </span>     
                </div>
                <div className="align-content-center mt-4">
                  {/* Wallet connection status */}
                </div> 
              </div>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
              <div className="card card-event card-classic">
                <div className="card-body card-classic-max-height d-flex justify-content-center">
                  <div className="loading-event-card">
                    <img                        
                      src={loadingGif}
                      width="35"
                      height="35"
                      alt=""
                    />
                  </div> 
                </div>
                <div className="d-flex justify-content-between m-3">
                  <div className="align-content-center mt-4"></div>
                  <div className="align-content-center mt-5"></div> 
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* MY EVENTS (if wallet connected) */}
              {provider && myEvents.length > 0 && (
                <>
                  {myEvents.map(event => (
                    <EventCard key={`my-${event.eventId}`} event={event} index={0} />
                  ))}
                </>
              )}

              {/* ALL EVENTS */}
              {provider ? (
                events.map(event => (
                  <EventCard key={event.eventId} event={event} index={0} />
                ))
              ) : (
                <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
                  <div className="card card-event card-classic">
                    <div className="wallet-non-connected">
                      <img 
                        className="mt-6"                       
                        src={walletStatus}
                        width="150"
                        height="140"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </>
    </Layout>
  );
};

export default EventsPage;