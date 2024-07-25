import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { getAll, getAllInvited, sign, update } from "../../services/collection.service";
import { buildSignature, getSigningMessage } from "../../utils/util";
import collectionNormalImage from "../../images/svg/collection-normal.svg";
import collectionMultisigImage from "../../images/svg/collection-multisig.svg";
import collectionMultisigIcon from "../../icons/svg/collection-multisig.svg";
import collectionNormalIcon from "../../icons/svg/collection-normal.svg";
import collectionAikenNormalIcon from "../../images/svg/collection-aiken-normal.svg"
import collectionAikenMultisigIcon from "../../images/svg/collection-aiken-multisig.svg"
import collectionOwnerIcon from "../../icons/svg/collection-owner.svg";
import collectionInvitedIcon from "../../icons/svg/collection-invited.svg";
import walletStatus from "../../images/collections/wallet-status.png";



const Collections = () => { 
  const getFilter = useParams();
  const [filter, setFilter] = useState(null);
  const [collections, setCollections] = useState([]);
  const [invitedCollections, setInvitedCollections] = useState([]);
  const { cardano: { wallet }, ethereum: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createSoul = () => {
    dispatch({
      type: 'CREATE_SOUL'
    });
  };  

  // const showCardanoWallet = () => {
  //   dispatch({
  //     type: 'SHOW_CARDANO_WALLET'
  //   });
  // };  

  const checkCollection = (id, name) => {
    const items = {id, name};
    dispatch({ type: 'CHECK_COLLECTION', payload: items });
  };  

  useEffect(() => {
    setFilter(getFilter);
    async function fetchData() {
      if (!wallet) {
        setCollections([]);
      } else {
        const _collections = await getAll(wallet.stake_address);
        const _invitedCollections = await getAllInvited(wallet.stake_address);
        setCollections(_collections);
        setInvitedCollections(_invitedCollections);
      }
    }
    fetchData()
  }, [wallet])

  const getInvitation = (collection) => {
    const { invited } = collection;
    return invited.find(i => i.user == wallet.stake_address);
  }

  const isUnsigned = (collection) => {
    const invitation = getInvitation(collection);
    return invitation && invitation.signature == '';
  }

  const allSigned = (collection) => {
    return collection.invited.every(i => i.signature != '');
  }

  const signCollection = async (collection, invited = false) => {
    const invitation = getInvitation(collection);
    const { addr, user } = invitation;
    const message = getSigningMessage(collection.policyHash);
    console.log('Address', wallet.address, addr);
    const signature = await wallet.api.signData(addr, message);
    const coseSig = buildSignature(addr, message, signature);
    const col = await sign(collection.collectionId, user, coseSig);
    if (invited) {
      const index = invitedCollections.findIndex(c => c.collectionId == col.collectionId);
      const updatedCollections = [...invitedCollections];
      updatedCollections[index] = col;
      setInvitedCollections(updatedCollections);
    } else {
      const index = collections.findIndex(c => c.collectionId == col.collectionId);
      const updatedCollections = [...collections];
      updatedCollections[index] = col;
      setCollections(updatedCollections);
    }
  }

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
                                <span className="text-uppercase"></span>
                                Collections
                            </h4>
                        </div>
                        <div className="inner-header-buttons">
                            {/* <button onClick="/wallet" className="simple-link pr-3">
                                <i className="icofont-listing-box"></i>
                            </button>
                            <button onClick="/wallet" className="simple-link">
                                <i className="icofont-filter"></i>
                            </button>       */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="row">
          <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card card-create bg-soulbound card-classic">
              <div className="card-body card-classic-max-height" onClick={wallet ? createSoul : console.log("alert! wallect connect")} >
                <h4>CREATE <span> SOUL COLLECTION</span></h4>               
                <div className={(wallet ? "plus-button" : "axis-button")+" align-content-center"} >
                  <div></div><div></div>
                </div>              
              </div>
              <div className="d-flex justify-content-between m-3">
                <div className="align-content-center mt-4">                    
                  <span className="verified">
                    {wallet && <i className="icofont-check-alt"></i>}
                    {!wallet && <i className="icofont-close-line"></i>}
                  </span>     
                </div>
                <div className="align-content-center mt-4">
                  {/* { !wallet && <button  className="btn btn-white btn-small" onClick={showCardanoWallet}>Connect</button> }
                  { wallet && <button  className="btn btn-danger btn-small" onClick={showCardanoWallet}>Change Wallet</button> } */}
                </div> 
              </div>
            </div>
          </div>
        {wallet && (
          collections.map(c => {
            console.log(c);
            return (
              <div key={c.collectionId} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
                <div className={ (c.invited.length == 1 ? (c.aikenCourse ? ("bg-collection-aiken-normal"):("bg-collection-normal")) : (c.aikenCourse ? ("bg-collection-aiken-multisig"):("bg-collection-multisig")))+" card card-collection card-classic" }>
                  <div className="card-body card-classic-max-height d-flex justify-content-start">
                    <img
                        className="mr-3 rounded-circle mr-0 mr-sm-3"
                        src={ c.invited.length == 1 ? (c.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalImage)) : (c.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigImage)) }
                        width="50"
                        height="50"
                        alt=""
                    />
                    <h4 className="text-capitalize">{c.name}</h4>  
                  </div>
                  <div className="d-flex justify-content-between m-3">
                    <div className="align-content-center mt-4">                    
                      <ul>
                        <li className="d-flex justify-content-start">
                          <img
                            className="mr-2"
                            src={ c.invited.length == 1 ? (collectionNormalIcon) : (collectionMultisigIcon) }
                            width="25"
                            height="25"
                            alt=""
                          />
                         { c.invited.length == 1 ?  (<p className="pt-1">simple</p>) :  (<p className="pt-1">multisig</p>) }
                        </li>
                        <li className="d-flex justify-content-start">
                          <img
                            className="mr-2"
                            src={ collectionOwnerIcon }
                            width="25"
                            height="25"
                            alt=""
                          />
                          <p className="pt-1">Owner</p>
                        </li>
                      </ul>            
                    </div>
                    <div className="align-content-center mt-5">                                
                      {isUnsigned(c) && (
                        <button 
                          type="button"
                          className='btn btn-primary btn-small'
                          onClick={() => signCollection(c)}
                        >
                        Sign
                        </button>                                                          
                      )}    
                      {allSigned(c) && (                               
                        <Link to={`/collection/${c.collectionId}`} className="btn btn-white btn-small">
                          View
                        </Link>                                                    
                      )}
                      {!allSigned(c) && !isUnsigned(c) && (     
                        <button 
                          type="button"
                          className='btn btn-secondary btn-small float-right'
                          onClick={() => checkCollection(c.collectionId, c.name)}
                        >Loading
                        </button>                                              
                      )} 
                    </div> 
                  </div>
                </div>
              </div>                          
            )
          })               
        )}
        {wallet && (
          invitedCollections.map(c => {
            console.log(c);
            return (
              <div key={c.collectionId} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
                <div className={ (c.invited.length == 1 ? (c.aikenCourse ? ("bg-collection-aiken-normal"):("bg-collection-normal")) : (c.aikenCourse ? ("bg-collection-aiken-multisig"):("bg-collection-multisig")))+" card card-collection card-classic" }>
                  <div className="card-body card-classic-max-height d-flex justify-content-start">
                    <img
                        className="mr-3 rounded-circle mr-0 mr-sm-3"
                        src={ c.invited.length == 1 ? (c.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalImage)) : (c.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigImage)) }
                        width="50"
                        height="50"
                        alt=""
                    />
                    <h4 className="capitalize">{c.name}</h4>  
                  </div>
                  <div className="d-flex justify-content-between m-3">
                    <div className="align-content-center mt-4">                    
                      <ul>
                        <li className="d-flex justify-content-start">
                          <img
                            className="mr-2"
                            src={collectionMultisigIcon}
                            width="25"
                            height="25"
                            alt=""
                          />
                          <p className="pt-1">Multisig</p>
                        </li>
                        <li className="d-flex justify-content-start">
                          <img
                            className="mr-2"
                            src={ collectionInvitedIcon }
                            width="25"
                            height="25"
                            alt=""
                          />
                          <p className="pt-1">Invited</p>
                        </li>
                      </ul>            
                    </div>
                    <div className="align-content-center mt-5">                                
                      {isUnsigned(c) && (
                        <button 
                          type="button"
                          className='btn btn-primary btn-small'
                          onClick={() => signCollection(c)}
                        >
                        Sign
                        </button>                                                          
                      )}    
                      {allSigned(c) && (                               
                        <Link to={`/collection/${c.collectionId}`} className="btn btn-white btn-small">
                          View
                        </Link>                                                    
                      )}
                      {!allSigned(c) && !isUnsigned(c) && (     
                        <button 
                          type="button"
                          className='btn btn-secondary btn-small float-right'
                          onClick={() => checkCollection(c.collectionId, c.name)}
                        >Loading
                        </button>                                              
                      )} 
                    </div> 
                  </div>
                </div>
              </div>                          
            )
          })               
        )}  
        {!wallet && (
        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-collection card-classic">
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
      </div>
    </>
    </Layout>
  );
};

export default Collections;
