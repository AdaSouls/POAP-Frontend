import React from "react";
import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import poapNormal from "../../images/svg/poap-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";

// A "poap" here is one SPOAP token in the connected wallet's private state — one token per issuer,
// which accumulates attendance across every event claimed for that issuer (see
// src/midnight/witnesses.ts's PoapPrivateState). Attendance history is private witness state, not
// indexed on-chain, so this reads entirely from the local private-state token record, not the
// public indexer.
const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

const PoapCard = ({ poap }) => {
  const dispatch = useDrawerDispatch();

  const viewPoap = () => {
    dispatch({ type: "VIEW_POAP_TOKEN", payload: poap });
  };

  const eventCount = poap.attendedEventIds?.length ?? 0;

  return (
    <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-3">
      <div
        className="card card-poap card-classic bg-poap-normal"
        style={{
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "";
        }}
        onClick={viewPoap}
      >
        <div className="card-body card-classic-max-height">
          <div className="d-flex justify-content-start mb-3">
            <img
              className="mr-3 rounded-circle"
              src={poapNormal}
              width="60"
              height="60"
              alt=""
              style={{ border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}
            />
            <div className="poap-info flex-grow-1">
              <h4 className="mb-2" style={{ fontSize: "18px", fontWeight: "600" }}>
                SPOAP #{String(poap.tokenId)}
              </h4>
              <div className="d-flex align-items-center">
                {poap.isSoulbound && (
                  <span className="badge bg-info mr-2" style={{ fontSize: "10px", padding: "2px 8px" }}>
                    Soulbound
                  </span>
                )}
                <span className="text-muted small">{eventCount} event{eventCount === 1 ? "" : "s"} attended</span>
              </div>
            </div>
          </div>

          <ul className="list-unstyled mb-0" style={{ fontSize: "13px" }}>
            <li className="d-flex align-items-center mb-2">
              <img className="mr-2" src={eventOwnerIcon} width="16" height="16" alt="" style={{ flexShrink: 0 }} />
              <span className="text-muted small">
                Issuer: <span className="text-white">{truncateHex(poap.issuerPkHex)}</span>
              </span>
            </li>
            {poap.attendedEventIds?.slice(0, 3).map((eventId) => (
              <li key={eventId} className="d-flex align-items-center mb-1">
                <i className="icofont-calendar mr-2" style={{ fontSize: "14px", width: "20px" }}></i>
                <span className="text-muted small">{truncateHex(eventId)}</span>
              </li>
            ))}
            {eventCount > 3 && (
              <li className="text-muted small">…and {eventCount - 3} more</li>
            )}
          </ul>
        </div>

        <div className="card-footer border-0 bg-transparent p-3 pt-0">
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-white btn-small"
              style={{ fontSize: "12px", padding: "4px 12px" }}
              onClick={(e) => {
                e.stopPropagation();
                viewPoap();
              }}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoapCard;
