import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import collectionMenu from "../../icons/svg/collection-menu.svg";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import PoapEvents from "./poapEvents";

const Events = () => {
  const [addressEvents, setAddressEvents] = useState([]);
  const {
    ethereum: { provider },
    poapEvents,
  } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createEvent = () => {
    dispatch({
      type: "CREATE_EVENT",
    });
  };

  const showEthereumWallet = () => {
    dispatch({
      type: "SHOW_ETHEREUM_WALLET",
    });
  };

  useEffect(() => {
    async function fetchData() {
      if (provider && poapEvents.length > 0) {
        setAddressEvents(
          poapEvents.filter(
            (event) => event.eventOrganizer === provider.address
          )
        );
      }
    }
    fetchData();
  }, [provider, poapEvents]);

  return (
    <div className="row">
      <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
        <div className="card card-create bg-poap card-classic">
          <div
            className="card-body card-classic-max-height"
            onClick={provider ? createEvent : console.log("nada")}
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
                  to={"#"}
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
  );
};

export default Events;
