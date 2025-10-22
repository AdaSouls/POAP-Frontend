import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import collectionMenu from "../../icons/svg/collection-menu.svg";
import walletStatus from "../../images/collections/wallet-status.png";
import { useDrawer } from "../contexts/drawer/drawer.provider";
const Create = () => { 
  const { provider } = useDrawer();
  return (
    <div className="col-xxl-5 col-xl-5 col-lg-4 col-md-7 col-sm-12">
      <div className="card card-classic">
        <div className="card-header">
          <h4 className="card-title">Events</h4>
          { provider && (
            <span>                  
              <Link to={'/create'} className="btn btn-gradient btn-icon rounded-lg">
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
        <div className="card-body card-classic-max-height-title">
          <div className="table-responsive">
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create;