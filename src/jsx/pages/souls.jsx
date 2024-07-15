import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import eternlWallet from "../../images/wallets/eternl.jpg";
import threeDots from "../../icons/svg/three-dots.svg";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { getAll, getAllInvited, sign, update } from "../../services/collection.service";
import { Button } from "react-bootstrap";
import { buildSignature, getSigningMessage } from "../../utils/util";

const Souls = () => { 
  const [collections, setCollections] = useState([]);
  const [invitedCollections, setInvitedCollections] = useState([]);
  const { cardano: { wallet } } = useDrawer();
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
    <Layout activeMenu={3}>
      <div className="row">

        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
          <div className="card card-create bg-soulbound card-classic">
            <div
              className="card-body card-classic-max-height"
              onClick={createSoul}
            >
              <h4>CREATE<span> SOULBOUND</span></h4>               
              <div className="plus-button align-content-center" >
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
                  { !wallet && <button  className="btn btn-gradient btn-small" onClick={showCardanoWallet}>Connect</button> }
                  { wallet && <button  className="btn btn-danger btn-small" onClick={showCardanoWallet}>Change Wallet</button> }
              </div> 
            </div>
          </div>
        </div>

        <div className="col-xxl-9 col-xl-8 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Collections</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                  {collections.map(c => {
                        return (
                          <tr key={c.collectionId} >
                            <td className="table-image">                      
                              <img
                                className="rounded-circle"
                                src={eternlWallet}
                                width="45"
                                height="45"
                                alt=""
                              />
                            </td>                      
                            <td>
                              {c.name}
                            </td>   
                            <td>
                               { isUnsigned(c) && (
                                <Button 
                                  type="button"
                                  className='btn'
                                  onClick={() => signCollection(c)}
                                >Sign</Button>
                               ) }
                            </td>                   
                            <td className="table-press-icon">
                              { allSigned(c) && (
                                <Link to={`/collections/${c.collectionId}`} className="table-link">
                                  <img
                                    src={threeDots}
                                    width="20"
                                    height="40"
                                    alt=""
                                  />
                                </Link>
                              ) }
                            </td>
                          </tr>
                        )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Invited Collections</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                  {invitedCollections.map(c => {
                        return (
                          <tr key={c.collectionId} >
                            <td className="table-image">                      
                              <img
                                className="rounded-circle"
                                src={eternlWallet}
                                width="45"
                                height="45"
                                alt=""
                              />
                            </td>                      
                            <td>
                              {c.name}
                            </td>   
                            <td>
                               { isUnsigned(c) && (
                                <Button 
                                  type="button"
                                  className='btn'
                                  onClick={() => signCollection(c, true)}
                                >Sign</Button>
                               ) }
                            </td>                   
                            <td className="table-press-icon">
                              { allSigned(c) && (
                                <Link to={`/collections/${c.collectionId}`} className="table-link">
                                  <img
                                    src={threeDots}
                                    width="20"
                                    height="40"
                                    alt=""
                                  />
                                </Link>
                              ) }
                            </td>
                          </tr>
                        )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div className="row">
        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
            <div className="card card-create bg-poap card-classic">
              <div
                className="card-body card-classic-max-height"
                onClick={createPoap}
              >
                <h4>CREATE<span> POAP</span></h4>               
                <div className="plus-button align-content-center">
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
                  <Link to={"#"} className="btn btn-secondary btn-small btn-negative">
                      Connect
                  </Link>
                </div> 
              </div>
            </div>
        </div>

        <div className="col-xxl-9 col-xl-8 col-lg-6 col-md-6">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">??????</h4>
              <span>
                <Link to={"#"} className="simple-link">
                  See more
                </Link>
              </span>
            </div>
            <div className="card-body card-classic-max-height-title">
            <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    <tr>
                      <td className="table-image">                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                      < Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>                      
                        <img
                          className="rounded-circle"
                          src={eternlWallet}
                          width="45"
                          height="45"
                          alt=""
                        />
                      </td>                      
                      <td>
                        Name
                      </td>                      
                      <td>
                        <Link to={"#"} className="table-link">
                          <img
                            src={threeDots}
                            width="20"
                            height="40"
                            alt=""
                          />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Souls;
