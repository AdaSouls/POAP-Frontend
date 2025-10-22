import React from "react";
import { Link } from "react-router-dom";
import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import poapNormal from "../../images/svg/poap-normal.svg";
import poapOwnerIcon from "../../images/svg/poap-normal.svg";
import poapStatusIcon from "../../images/svg/poap-normal.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

const PoapCard = ({ poap, index }) => {
  const dispatch = useDrawerDispatch();

  const viewPoap = () => {
    dispatch({
      type: "VIEW_POAP_TOKEN",
      payload: poap,
    });
  };

  const getEventTitle = () => {
    if (poap.events && poap.events.length > 0) {
      return poap.events[0].title || `Event ${poap.events[0].eventIdInContract}`;
    }
    return `Event ${poap.eventId}`;
  };

  const getEventImage = () => {
    if (poap.events && poap.events.length > 0) {
      return poap.events[0].image || poapNormal;
    }
    return poapNormal;
  };

  const getIssuerId = () => {
    if (poap.events && poap.events.length > 0) {
      return poap.events[0].issuerIdInContract;
    }
    return poap.issuerId;
  };

  const isExpired = () => {
    if (poap.events && poap.events.length > 0) {
      return poap.events[0].isExpired || false;
    }
    return false;
  };

  return (
    <div key={poap.tokenId || poap.poapUuid} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
      <div className={`card card-poap card-classic ${isExpired() ? 'bg-poap-expired' : 'bg-poap-normal'}`}>
        <div className="card-body card-classic-max-height d-flex justify-content-start">
          <img
            className="mr-3 rounded-circle mr-0 mr-sm-3"
            src={getEventImage()}
            width="50"
            height="50"
            alt="POAP"
          />
          <div className="poap-info">
            <h4 className="text-capitalize mb-1">
              {getEventTitle()}
            </h4>
            <p className="text-muted small mb-0">
              Token ID: {poap.tokenId}
            </p>
          </div>
        </div>
        <div className="d-flex justify-content-between m-3">
          <div className="align-content-center mt-4">
            <ul>
              <li className="d-flex justify-content-start">
                <img
                  className="mr-2"
                  src={poapStatusIcon}
                  width="25"
                  height="25"
                  alt=""
                />
                <p className="pt-1 text-success">
                  Minted
                </p>
              </li>
              <li className="d-flex justify-content-start">
                <img
                  className="mr-2"
                  src={poapOwnerIcon}
                  width="25"
                  height="25"
                  alt=""
                />
                <p className="pt-1">Owner</p>
              </li>
              <li className="d-flex justify-content-start">
                <i className="icofont icofont-calendar mr-2 mt-1"></i>
                <p className="pt-1 small">
                  {formatDateToDDMMYYYY(new Date(poap.createdAt))}
                </p>
              </li>
            </ul>
          </div>
          <div className="align-content-center mt-5">
            <div className="mb-2">
              <small className="text-muted">
                Issuer: {getIssuerId()}
              </small>
            </div>
            <button
              type="button"
              className="btn btn-white btn-small"
              onClick={viewPoap}
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
