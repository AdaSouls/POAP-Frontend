import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import collectionIconNormal from "../../images/svg/collection-normal.svg"
import collectionIconMultisig from "../../images/svg/collection-multisig.svg"
import poapNormal from "../../images/svg/poap-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import collectionMenu from "../../icons/svg/collection-menu.svg";
import loadingIcon from "../../icons/svg/loading-icon.svg";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { getAll, getAllInvited, sign, update } from "../../services/collection.service";
import { buildSignature, getSigningMessage } from "../../utils/util";
import walletStatus from "../../images/collections/walletStatus.png";

const Souls = () => { 
  const [collections, setCollections] = useState([]);
  const [invitedCollections, setInvitedCollections] = useState([]);
  const { cardano: { wallet }, ethereum: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createPoap = () => {
    dispatch({
      type: 'CREATE_POAP'
    });
  };  

  const createSoul = () => {
    dispatch({
      type: 'CREATE_SOUL'
    });
  };  

  const showCardanoWallet = () => {
    dispatch({
      type: 'SHOW_CARDANO_WALLET'
    });
  };  

  const showEthereumWallet = () => {
    dispatch({
      type: 'SHOW_ETHEREUM_WALLET'
    });
  };  

  useEffect(() => {
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
      <div className="row">

        <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
          <div className="card card-create bg-soulbound card-classic">
            <div className="card-body card-classic-max-height" onClick={wallet ? createSoul : console.log("nada")} >
              <h4>CREATE<span> SOUL COLLECTION</span></h4>               
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
              <span>
                <Link to={"/collections/souls"} className="btn btn-gradient btn-icon rounded-lg">
                <img
                  className="p-1"
                  src={collectionMenu}
                  width="35"
                  height="35"
                  alt=""
                />
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
              <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                  {wallet ? (
                  collections.map(c => {
                        return (
                          <tr key={c.collectionId} >
                            <td className="table-image">                      
                              <img
                                className="rounded-circle border-1"
                                src={collectionIconNormal}
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
                                  onClick={() => showCardanoWallet()}
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
                  ) : (
                    <div className="wallet-non-connected">
                        <img                        
                          src={walletStatus}
                          width="150"
                          height="140"
                          alt=""
                        />
                      </div>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-12">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Invited Collections</h4>
              <span>
                <Link to={"/collections/souls"} className="btn btn-gradient-purple btn-icon rounded-lg">
                <img
                  className="p-1"
                  src={collectionMenu}
                  width="35"
                  height="35"
                  alt=""
                />
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                  {wallet ? (
                  invitedCollections.map(c => {
                        return (
                          <tr key={c.collectionId} >
                            <td className="table-image">                      
                              <img
                                className="rounded-circle border-1"
                                src={collectionIconMultisig}
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
                                <td className="table-press-icon align-items-center">
                                <Link to={`/collection/${c.collectionId}`} className="table-link">
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
                                  onClick={() => showCardanoWallet()}
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
                  ):(
                    <div className="wallet-non-connected">
                        <img                        
                          src={walletStatus}
                          width="150"
                          height="140"
                          alt=""
                        />
                      </div>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="row">

        <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
          <div className="card card-create bg-poap card-classic">
            <div className="card-body card-classic-max-height" onClick={provider ? createPoap : console.log("nada")} >
              <h4>CREATE<span> POAP COLLECTION</span></h4>               
              <div className={(provider ? "plus-button" : "axis-button")+" align-content-center"} >
                <div></div><div></div>
              </div>              
            </div>
            <div className="d-flex justify-content-between m-3">
              <div className="align-content-center mt-4">                    
                <span className="not-verified">
                  <i className="icofont-close-line"></i>
                </span>                
              </div>
              <div className="align-content-center mt-4">
              { !provider && <button  className="btn btn-white btn-small" onClick={showEthereumWallet}>Connect</button> }
              { provider && <button  className="btn btn-danger btn-small" onClick={showEthereumWallet}>Change Wallet</button> }
              </div> 
            </div>
          </div>
        </div>

        <div className="col-xxl-5 col-xl-5 col-lg-4 col-md-7 col-sm-12">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Collections</h4>
              <span>
                {/* <Link to={"#"} className="simple-link">
                  See more
                </Link> */}
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                  {provider ? (
                    <>
                    <tr>
                    <td className="table-image">                      
                      <img
                        className="rounded-circle"
                        src={poapNormal}
                        width="47"
                        height="47"
                        alt=""
                      />
                    </td>                      
                    <td>
                      Name
                    </td>                      
                    <td className="table-press-icon">
                      <Link to={"#"} className="table-link">
                        <img
                          src={circleArrow}
                          width="30"
                          height="30"
                          alt=""
                        />
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="table-image">                      
                      <img
                        className="rounded-circle"
                        src={poapNormal}
                        width="47"
                        height="47"
                        alt=""
                      />
                    </td>                      
                    <td>
                      Name
                    </td>                      
                    <td className="table-press-icon">
                      <Link to={"#"} className="table-link">
                        <img
                          src={circleArrow}
                          width="30"
                          height="30"
                          alt=""
                        />
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="table-image">                      
                      <img
                        className="rounded-circle"
                        src={poapNormal}
                        width="47"
                        height="47"
                        alt=""
                      />
                    </td>                      
                    <td>
                      Name
                    </td>                      
                    <td className="table-press-icon">
                      <Link to={"#"} className="table-link">
                        <img
                          src={circleArrow}
                          width="30"
                          height="30"
                          alt=""
                        />
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="table-image">                      
                      <img
                        className="rounded-circle"
                        src={poapNormal}
                        width="47"
                        height="47"
                        alt=""
                      />
                    </td>                      
                    <td>
                      Name
                    </td>                      
                    <td className="table-press-icon">
                      <Link to={"#"} className="table-link">
                        <img
                          src={circleArrow}
                          width="30"
                          height="30"
                          alt=""
                        />
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="table-image">                      
                      <img
                        className="rounded-circle"
                        src={poapNormal}
                        width="47"
                        height="47"
                        alt=""
                      />
                    </td>                      
                    <td>
                      Name
                    </td>                      
                    <td className="table-press-icon">
                      <Link to={"#"} className="table-link">
                        <img
                          src={circleArrow}
                          width="30"
                          height="30"
                          alt=""
                        />
                      </Link>
                    </td>
                  </tr>
                  </>
                  ):(
                    <div className="wallet-non-connected">
                        <img                        
                          src={walletStatus}
                          width="150"
                          height="140"
                          alt=""
                        />
                      </div>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-12">
          <div className="card card-classic">
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Souls;
