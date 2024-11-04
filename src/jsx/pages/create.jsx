import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import collectionNormalIcon from "../../images/svg/collection-normal.svg"
import collectionMultisigIcon from "../../images/svg/collection-multisig.svg"
import collectionAikenNormalIcon from "../../images/svg/collection-aiken-normal.svg"
import collectionAikenMultisigIcon from "../../images/svg/collection-aiken-multisig.svg"
import poapNormal from "../../images/svg/poap-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import collectionMenu from "../../icons/svg/collection-menu.svg";
import loadingIcon from "../../icons/svg/loading-icon.svg";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { getAll, getAllInvited, sign, update } from "../../services/collection.service";
import { buildSignature, getSigningMessage } from "../../utils/util";
import walletStatus from "../../images/collections/wallet-status.png";
import walletEmpty from "../../images/collections/wallet-empty.png";
import loadingGif from "../../images/loading.gif";

const Create = () => { 
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitedCollections, setInvitedCollections] = useState([]);
  const { cardano: { wallet }, ethereum: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createSoul = () => {
    dispatch({
      type: 'CREATE_SOUL'
    });
  };  

  const createPoap = () => {
    dispatch({
      type: 'CREATE_POAP'
    });
  };  

  const showEthereumWallet = () => {
    dispatch({
      type: 'SHOW_ETHEREUM_WALLET'
    });
  };  

  const showCardanoWallet = () => {
    dispatch({
      type: 'SHOW_CARDANO_WALLET'
    });
  };  

  const checkCollection = (id, name) => {
    const items = {id, name};
    dispatch({ type: 'CHECK_COLLECTION', payload: items });
  };  

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (!wallet) {
        setCollections([]);
        setLoading(false);
      } else {
        const _collections = await getAll(wallet.stake_address);
        const _invitedCollections = await getAllInvited(wallet.stake_address);
        setCollections(_collections);
        setInvitedCollections(_invitedCollections);
        setLoading(false);
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
    <Layout activeMenu={3}>
      <div className="row">

        <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
          <div className="card card-create bg-soulbound card-classic">
            <div className="card-body card-classic-max-height" onClick={wallet ? createSoul : console.log("alert! wallect connect")} >
              <h4>CREATE <span>SOUL COLLECTION</span></h4>               
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
                { !wallet && <button  className="btn btn-white btn-small" onClick={showCardanoWallet}>Connect</button> }
                { wallet && <button  className="btn btn-danger btn-small" onClick={showCardanoWallet}>Change Wallet</button> }
              </div> 
            </div>
          </div>
        </div>

        <div className="col-xxl-5 col-xl-5 col-lg-4 col-md-7 col-sm-12">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Collections</h4>
              {wallet && (
                <span>                  
                  <Link to={collections.slice(-4) != 0 ? ('/collections/souls') : ('')} className="btn btn-gradient btn-icon rounded-lg">
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
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                  { loading ? (
                    <div className="loading-card">
                      <img                        
                        src={loadingGif}
                        width="50"
                        height="50"
                        alt=""
                      />
                    </div>
                  ):(
                    wallet ? (
                      collections.slice(-4) <= 0 ? (
                        <div className="wallet-non-connected">
                          <img                        
                            src={walletEmpty}
                            width="150"
                            height="140"
                            alt=""
                          />
                          <p className="m-auto text-center">No collections</p>
                        </div>
                      ) : (
                        collections.slice(-4).map(c => {
                          return (
                            <tr key={c.collectionId} >
                              <td className="table-image">                      
                                <img
                                  className="rounded-circle border-1"
                                  src={ c.invited.length == 1 ? (c.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalIcon)) : (c.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigIcon)) }
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>                      
                              <td>
                                {c.name}
                              </td>  
                              
                                 { isUnsigned(c) && (  
                                  <td className="table-press-icon">
                                  <button 
                                    type="button"
                                    className='btn btn-gradient btn-icon px-2'
                                    onClick={() => signCollection(c)}
                                  >Sign</button>
                                  </td>                               
                                 ) }
                                                
                             
                                { allSigned(c) && (                               
                                   <td className="table-press-icon">
                                  <Link to={`/collection/${c.collectionId}`} className="table-link float-right">
                                    <img
                                      src={circleArrow}
                                      width="30"
                                      height="30"
                                      alt=""
                                    />
                                  </Link>
                                  </td>                              
                                ) }
  
                                  { !allSigned(c) && !isUnsigned(c) && (                               
                                   <td className="table-press-icon">
                                  <button 
                                    type="button"
                                    className='btn btn-secondary btn-icon float-right'
                                    onClick={() => checkCollection(c.collectionId, c.name)}
                                  ><img
                                      src={loadingIcon}
                                      width="21"
                                      height="21"
                                      alt=""
                                    />
                                  </button>
                                  </td>                              
                                )}
                            </tr>
                          )
                        })
                      )                                  
                    ) : (
                      <div className="wallet-non-connected">
                        <img                        
                          src={walletStatus}
                          width="150"
                          height="140"
                          alt=""
                        />
                      </div>
                    )
                  )} 
                                   
                  </tbody>                  
                </table>
                {collections.length > 4 && (
                      <Link to={"/collections/souls"} className="btn btn-white btn-small btn-block mt-3">See More</Link>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-12">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Multisig Collections</h4>
              {wallet && (
                <span>
                <Link to={invitedCollections.slice(-4) != 0 ? ('/collections/souls') : ('')} className="btn btn-gradient-purple btn-icon rounded-lg">
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
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                  { loading ? (
                    <div className="loading-card">
                      <img                        
                        src={loadingGif}
                        width="50"
                        height="50"
                        alt=""
                      />
                    </div>
                  ):(
                    wallet ? (
                      invitedCollections.slice(-4) <= 0 ? (
                        <div className="wallet-non-connected">
                          <img                        
                            src={walletEmpty}
                            width="150"
                            height="140"
                            alt=""
                          />
                          <p className="m-auto text-center">No multisig collections</p>
                        </div>
                      ) : (
                        invitedCollections.slice(-4).map(c => {
                          return (
                            <tr key={c.collectionId} >
                              <td className="table-image">                      
                                <img
                                  className="rounded-circle border-1"
                                  src={ c.invited.length == 1 ? (c.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalIcon)) : (c.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigIcon)) }
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>                      
                              <td>
                                {c.name}
                              </td>   
                              
                                 { isUnsigned(c) && (
                                  <td className="table-press-icon">
                                  <button 
                                    type="button"
                                    className='btn btn-gradient btn-icon px-2'
                                    onClick={() => signCollection(c, true)}
                                  >Sign</button>
                                   </td>
                                 ) }
                                                
                              
                                { allSigned(c) && (
                                  <td className="table-press-icon">
                                  <Link to={`/collection/${c.collectionId}`} className="table-link float-right">
                                    <img
                                      src={circleArrow}
                                      width="30"
                                      height="30"
                                      alt=""
                                    />
                                  </Link>
                                  </td>
                                ) }
  
                                { !allSigned(c) && !isUnsigned(c) && (                               
                                   <td className="table-press-icon">
                                  <button 
                                    type="button"
                                    className='btn btn-secondary btn-icon float-right'
                                    onClick={() => checkCollection()}
                                  ><img
                                      src={loadingIcon}
                                      width="21"
                                      height="21"
                                      alt=""
                                    />
                                  </button>
                                  </td>                              
                                ) }
                             
                            </tr>
                          )
                        })
                      )
                      
                      ):(
                        <div className="wallet-non-connected">
                            <img                        
                              src={walletStatus}
                              width="150"
                              height="140"
                              alt=""
                            />
                          </div>
                      ) 
                  )}
                  
                  </tbody>
                </table>
                {invitedCollections.length > 4 && (                  
                  <Link to={"/collections/all"} className="btn btn-white btn-small btn-block mt-3">See More</Link>                  
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </Layout>
  );
};

export default Create;
