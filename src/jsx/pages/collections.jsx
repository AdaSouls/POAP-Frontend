import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import eventIcon from "../../images/collections/eventIcon.jpg";
import streamEventIcon from "../../images/collections/streamEventIcon.jpg";
import infinite from "../../icons/svg/infinite.svg";
import event from "../../icons/svg/event.svg";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { getAll } from "../../services/collection.service";
import collectionIconNormal from "../../images/svg/collection-normal.svg"
import collectionIconMultisig from "../../images/svg/collection-multisig.svg"

const Collections = () => { 
  const section = useParams();
  const [collections, setCollections] = useState([]);
  const [ethCollections, setEthCollections] = useState([]);
  const { cardano: { wallet }, ethereum: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  console.log(section);

  const createSoul = () => {
    dispatch({
      type: 'CREATE_SOUL'
    });
  };  

  useEffect(() => {
    async function fetchData() {
      if (!wallet) {
        setCollections([]);
      } else {
        const _collections = await getAll(wallet.address);
        setCollections(_collections);
      }
    }
    fetchData()
  }, [wallet])

  return (
    <Layout activeMenu={4}>
        <>
        <div className="row">
            {/* CARDS HEADER */}
            <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
                <div className="card inner-header">
                    <div className="d-flex justify-content-between m-3">
                        <div className="inner-header-back">
                            <Link to="/souls" className="simple-link">
                                <i className="icofont-rounded-left"></i>   
                            </Link>                            
                        </div>
                        <div className="inner-header-title">
                            <h4>
                                <span className="text-uppercase">{section.section+" "}</span>
                                Collections
                            </h4>
                        </div>
                        <div className="inner-header-buttons">
                            <button onClick="/wallet" className="simple-link pr-3">
                                <i className="icofont-listing-box"></i>
                            </button>
                            <button onClick="/wallet" className="simple-link">
                                <i className="icofont-filter"></i>
                            </button>      
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="row">
            {/* COLLECTION CARD */}
            <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
                <div className="card card-collection bg-stream-event card-classic">
                    <div className="card-body card-classic-max-height d-flex justify-content-start">
                        <img
                            className="mr-3 rounded-circle mr-0 mr-sm-3"
                            src={collectionIconNormal}
                            width="50"
                            height="50"
                            alt=""
                        />
                        <h4>Cardano SUMMIT 2023</h4>  
                    </div>
                    <div className="d-flex justify-content-between m-3">
                      <div className="align-content-center mt-4">                    
                          <ul>
                            <li className="d-flex justify-content-start">
                              <img
                                className="mr-2"
                                src={event}
                                width="25"
                                height="25"
                                alt=""
                              />
                              <p className="pt-1">Event</p>
                            </li>
                            <li className="d-flex justify-content-start">
                              <img
                                className="mr-2"
                                src={infinite}
                                width="25"
                                height="25"
                                alt=""
                              />
                              <p className="pt-1">Supply</p>
                            </li>
                          </ul>            
                        </div>
                        <div className="align-content-center mt-5">
                            <Link className="btn btn-white btn-small" to={"/collection/0"}>View</Link>
                        </div> 
                    </div>
                </div>
            </div>
             {/* COLLECTION CARD */}
             <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
                <div className="card card-collection bg-event card-classic">
                    <div className="card-body card-classic-max-height d-flex justify-content-start">
                        <img
                            className="mr-3 rounded-circle mr-0 mr-sm-3"
                            src={collectionIconMultisig}
                            width="50"
                            height="50"
                            alt=""
                        />
                        <h4>Cardano SUMMIT 2024</h4>  
                    </div>
                    <div className="d-flex justify-content-between m-3">
                        <div className="align-content-center mt-4">                    
                          <ul>
                            <li className="d-flex justify-content-start">
                              <img
                                className="mr-2"
                                src={event}
                                width="25"
                                height="25"
                                alt=""
                              />
                              <p className="pt-1">Event</p>
                            </li>
                            <li className="d-flex justify-content-start">
                              <p className="mr-2 pt-1" >
                                <span>750</span>
                              </p>
                              <p className="pt-1">Supply</p>
                            </li>
                          </ul>            
                        </div>
                        <div className="align-content-center mt-5">
                            <Link className="btn btn-white btn-small" to={"/collection/1"}>View</Link>
                        </div> 
                    </div>
                </div>
            </div>
        </div>
        </>
    </Layout>
  );
};

export default Collections;
