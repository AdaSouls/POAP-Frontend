import { useState } from "react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import formatDateToDDMMYYYY from "../../../utils/formatDateToDDMMYYYY";
import EventBody from "../../components/eventBody";
import circlePlus from "../../../icons/svg/circle-plus.svg";

export default function ViewPoap() {
  const {
    poap,
    ethereum: { provider },
    poapEvents,
    poapOwner,
  } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [expandedEvents, setExpandedEvents] = useState([]);

  console.log("🚀 ~ ViewPoap ~ poap:", poap);
  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const hasValue = (value) => {
    return value !=== null && value !=== undefined && value !=== "";
  };

  // Toggle event expansion
  const toggleEvent = (index) => {
    setExpandedEvents((prev) =>
      prev.includes(index) ? prev.filter((i) => i !=== index) : [...prev, index]
    );
  };

  // Check if an event is expanded
  const isEventExpanded = (index) => {
    return expandedEvents.includes(index);
  };

  return (
    <div className="container absolute top-0 start-0 w-100 h-100 p-3 overflow-auto">
      <div className="drawer-header">
        <div className="d-flex justify-content-start">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold capitalize">
            Poap Token
          </h4>
        </div>
      </div>

      <div className="drawer-body">
        <div className="row g-3">
          <div className="col-6">
            <p className="m-0 font-weight-bolder">Instance</p>
            <p className="m-0 mb-3">{poap.instance}</p>
          </div>
          <div className="col-6">
            <p className="m-0 font-weight-bolder">Issuer ID</p>
            <p className="m-0 mb-3">{poap.events[0].issuerIdInContract}</p>
          </div>
          <div className="col-12">
            <p className="m-0 font-weight-bolder">Minted</p>
            <p className="m-0 mb-3">{formatDateToDDMMYYYY(poap.createdAt)}</p>
          </div>

          <hr className="col-12 my-2" />

          <h3 className="pb-3">Events: {poap.events.length}</h3>

          {poap?.events.map((event, index) => (
            <div
              className="mb-3"
              key={index}
              style={{
                border: "1px solid #ccc",
                padding: "10px 30px",
                borderRadius: "5px",
                boxSizing: "border-box",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => toggleEvent(index)}
                style={{ cursor: "pointer" }}
              >
                <h4 className="m-0" style={{ opacity: `${isEventExpanded(index) ? "0%" : "100%"}` }}>
                  {event.title} - {formatDateToDDMMYYYY(event.createdAt)}
                </h4>
                <div
                  style={{
                    transform: isEventExpanded(index) ? "rotate(45deg)" : "",
                    transition: "transform 0.3s",
                  }}
                >
                  <img src={circlePlus} width="20" height="20" alt="" />
                </div>
              </div>

              {isEventExpanded(index) && (
                <div>
                  <div className="mb-4"></div>
                  <EventBody event={event} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
