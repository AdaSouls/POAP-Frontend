import { useEffect, useState } from "react";
import Layout from "../layout/layout";
import { Link } from "react-router-dom";
import collectionMenu from "../../icons/svg/collection-menu.svg";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import PoapEvents from "../components/poapEvents";
import {
  getAllEventsService,
  getAllPoapsService,
  getIssuerByAddressService,
  getOwnerPoapsService,
  getOwnerByAddressService
} from "../../services/paima.service";
import { informationFunction } from "../toasts/sweetAlerts";
import dataSyncService from "../../services/dataSync.service";

const Create = () => {
  const [addressEvents, setAddressEvents] = useState([]);
  const {
    ethereum: { provider },
    poapEvents,
    poapIssuer,
  } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createEvent = async () => {
    if (provider && poapIssuer === null) {
      console.log(
        "🚀 ~ createEvent ~ poapIssuer === null:",
        poapIssuer === null
      );
      const issuer = await getIssuerByAddressService(
        provider.address.toLowerCase()
      );
      if (!issuer) {
        informationFunction(
          "Wallet has no Issuer profile",
          "Please create an Issuer profile to create POAP events."
        );
        dispatch({
          type: "CREATE_ISSUER",
        });
        return;
      } else {
        dispatch({
          type: "UPDATE_ISSUER",
          payload: issuer,
        });
      }
    }
    dispatch({
      type: "CREATE_EVENT",
    });
  };

  const showEthereumWallet = () => {
    dispatch({
      type: "SHOW_ETHEREUM_WALLET",
    });
  };

  const updateIssuer = (issuer) => {
    dispatch({
      type: "UPDATE_ISSUER",
      payload: issuer,
    });
  };

  const updateEvents = (events) => {
    console.log("updating events in context:", events)
    dispatch({
      type: "UPDATE_EVENTS",
      payload: events,
    });
  };

  const updatePoaps = (poaps) => {
    dispatch({
      type: "UPDATE_POAPS",
      payload: poaps,
    });
  };

  const updateOwner = (owner) => {
    dispatch({
      type: "UPDATE_OWNER",
      payload: owner,
    });
  };

  function updateIssuersEvents() {
    if (provider && poapEvents?.length > 0) {
      console.log(
        "🚀 ~ updateIssuersEvents ~ poapEvents.length:",
        poapEvents.length
      );
      const ownersEvents = poapEvents.filter((event) => {
        return (
          event?.issuerUuid === poapIssuer?.issuerUuid &&
          event?.approved === "Approved"
        );
      });
      console.log("🚀 ~ ownersEvents ~ ownersEvents:", ownersEvents);
      setAddressEvents(ownersEvents);
    }
  }

  async function fetchIssuer() {
    if (provider && provider.address) {
      const issuer = await getIssuerByAddressService(
        provider.address.toLowerCase()
      );
      updateIssuer(issuer);
    }
  }

  async function fetchOwner() {
    if (provider && provider.address) {
      const owner = await getOwnerByAddressService(
        provider.address.toLowerCase()
      );
      updateOwner(owner);
    }
  }

  async function getOwnerPoaps() {
    if (provider && provider.address) {
      const poaps = await getOwnerPoapsService(provider.address);
      if (!poaps) {
        console.error("Error getting POAPs for address", provider.address);
        return;
      }
      updatePoaps(poaps);
    }
  }

  async function getEvents() {
    if (provider && provider.address) {
      const events = await getAllEventsService();
      console.log("getting all events: >>>>>>>>>>>>>>", events);
      await getAllPoapsService();
      updateEvents(events);
      const poaps = await getOwnerPoapsService(provider.address);
      if (!poaps) {
        console.error("Error getting POAPs for address", provider.address);
        return;
      }
      updatePoaps(poaps);
    }
  }

  // Set up data synchronization
  useEffect(() => {
    if (provider && provider.address) {
      // Start polling for events data
      dataSyncService.startEventsPolling(updateEvents, 5000);
      
      // Start polling for POAPs data
      dataSyncService.startPoapsPolling(updatePoaps, 5000);

      // Fetch initial data
      fetchIssuer();
      fetchOwner();
      getOwnerPoaps();
    }

    // Cleanup on unmount or when provider changes
    return () => {
      dataSyncService.stopAllPolling();
    };
  }, [provider]);

  useEffect(() => {
    console.log("Inside useEffect for fetching address events");
    updateIssuersEvents();
  }, [provider, poapEvents, poapIssuer]);

  return (
    <Layout activeMenu={2}>
        <div className="row">
        {/* Version Info */}
        <div className="col-12 mb-3">
            <div className="card">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h4>Events - Integrated Version</h4>
                    <p className="text-muted mb-0">
                    Backend + Smart Contracts integration with real-time data synchronization
                    </p>
                </div>
                <Link to="/mvp" className="btn btn-outline-secondary">
                    Switch to Smart Contract Only
                </Link>
                </div>
            </div>
            </div>
        </div>

        <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
            <div className="card card-create bg-poap card-classic">
            <div
                className="card-body card-classic-max-height"
                onClick={provider && createEvent}
            >
                <h4>
                CREATE <span> POAP EVENT</span>
                </h4>
                <div
                className={
                    (provider ? "plus-button" : "axis-button") +
                    " align-content-center"
                }
                >
                <div></div>
                <div></div>
                </div>
            </div>
            <div className="d-flex justify-content-between m-3">
                <div className="align-content-center mt-4">
                <span className="not-verified">
                    <i className="icofont-close-line"></i>
                </span>
                </div>
                <div className="align-content-center mt-4">
                {!provider && (
                    <button
                    className="btn btn-white btn-small"
                    onClick={showEthereumWallet}
                    >
                    Connect
                    </button>
                )}
                {provider && (
                    <button
                    className="btn btn-danger btn-small"
                    onClick={showEthereumWallet}
                    >
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
                <h4 className="card-title">Events</h4>
                {provider && (
                <span>
                    <Link
                    to={"/events"}
                    className="btn btn-gradient-purple btn-icon rounded-lg"
                    >
                    <img
                        className="p-1"
                        src={collectionMenu}
                        width="35"
                        height="35"
                        alt=""
                    />
                    </Link>
                </span>
                )}
            </div>
            <div
                className="card-body card-classic-max-height-title"
                style={{ overflow: "hidden", overflowY: "auto" }}
            >
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
