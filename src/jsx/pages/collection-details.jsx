import { Link, useParams } from "react-router-dom";
import { get, updateToken } from "../../services/collection.service";
import Layout from "../layout/layout";
import { useEffect, useState } from "react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { burnToken } from "../../utils/util";
import collectionNormalImage from "../../images/svg/collection-normal.svg";
import collectionMultisigImage from "../../images/svg/collection-multisig.svg";
import collectionMultisigIcon from "../../icons/svg/collection-multisig.svg";
import collectionNormalIcon from "../../icons/svg/collection-normal.svg";
import collectionAikenNormalIcon from "../../images/svg/collection-aiken-normal.svg"
import collectionAikenMultisigIcon from "../../images/svg/collection-aiken-multisig.svg"
import collectionOwnerIcon from "../../icons/svg/collection-owner.svg";
import collectionInvitedIcon from "../../icons/svg/collection-invited.svg";
import tokenAikenNormal from "../../images/svg/aiken-normal.svg";
import tokenAikenMultisig from "../../images/svg/aiken-multisig.svg";
import tokenSoulNormal from "../../images/svg/soul-normal.svg";
import tokenSoulMultisig from "../../images/svg/soul-multisig.svg";
import PerfectScrollbar from "react-perfect-scrollbar";
import loadingGif from "../../images/loading.gif";

const Collection = () => {
    const { id } = useParams();
    const { cardano: { wallet } } = useDrawer();
    const dispatch = useDrawerDispatch();
    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const createSoulToken = () => {
        dispatch({
          type: 'CREATE_SOUL_TOKEN',
          payload: collection
        });
    }; 

    const viewToken = ( token, collection ) => {
      const getToken = { token, collection };
      dispatch({ type: 'VIEW_TOKEN', payload: getToken });
    }; 

    const showCardanoWallet = () => {
        dispatch({
          type: 'SHOW_CARDANO_WALLET'
        });
    };

    const burnSoulToken = async (token) => {
        const provider = wallet.provider;
        const addr = wallet.address;

        const { collectionId, policy, policyId, redeem, mint, invited } = collection;
        const signerKey = wallet.utils.getAddressDetails(addr).paymentCredential.hash;
        const utxo = (await provider.wallet.getUtxos())[0];
        const tokenUtxo = token.claimUtxo || token.mintUtxo;
        const signatures = invited.reduce((dict, sig) => ({...dict, [sig.keyHash]: sig.signature}), {});
        const txSigned = await burnToken(token.name, policy, policyId, signatures, mint, redeem, tokenUtxo, utxo, provider);
        console.log('Tx Cbor:', txSigned.toString());
        const txId = txSigned.toHash();
        await updateToken(collectionId, token.soulboundId, { burnTx: txId });
        const updatedCollection = await get(collectionId, wallet.stake_address);
        setCollection(updatedCollection);

        await txSigned.submit();
        console.log('Tx Id:', txId);
        const success = await provider.awaitTx(txId);
        console.log('Success?', success);
    }

    useEffect(() => {
        const fetchData = async () => {
          try {
            if (!wallet) {
                setCollection(null);
            } else {
                const data = await get(id, wallet.stake_address);
                setCollection(data);
            }
          } catch (err) {
            setError(err);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, [id, wallet]);

    return (
      <Layout activeMenu={3}>
            { error && (<p>Error loading collection: {error.message}</p>) }
            
              <>
                <div className="row">
                  {/* CARDS HEADER */}
                  <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
                      <div className="card inner-header">
                          <div className="d-flex justify-content-between m-3">
                              <div className="inner-header-back">
                                  <Link to="/collections/souls" className="simple-link">
                                      <i className="icofont-rounded-left"></i>   
                                  </Link>                            
                              </div>
                              <div className="inner-header-title">
                                  <h4>                                      
                                      SOUL COLLECTION
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
                  {/* CREATE TOKEN */}
                  <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
                    <div className="card card-create bg-soulbound card-classic">
                      <div
                        className="card-body card-classic-max-height"
                        onClick={createSoulToken}
                      >
                        <h4>CREATE <span>SOULBOUND TOKEN</span></h4>               
                        <div className="plus-button align-content-center" >
                          <div></div><div></div>
                        </div>              
                      </div>
                      <div className="d-flex justify-content-between m-3">
                            <div className="align-content-center mt-4">                    
                            <span className="verified">
                            { wallet && <i className="icofont-check-alt"></i> }
                            { !wallet && <i className="icofont-close-line"></i> }
                            </span>     
                            </div>
                        <div className="align-content-center mt-4"></div> 
                      </div>
                    </div>
                  </div>
                  {/* COLLECTION BANNER */}
                  { loading ? (
                    <div className="col-xxl-5 col-xl-5 col-lg-4 col-md-7 col-sm-12">
                    <div className={" card card-collection card-classic" }>
                      <div className="card-body card-classic-max-height d-flex justify-content-start">
                        <div className="loading-collection-card">
                          <img                        
                            src={loadingGif}
                            width="35"
                            height="35"
                            alt=""
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between m-3">
                        <div className="align-content-center mt-4"></div>
                        <div className="align-content-center mt-5"></div> 
                      </div>
                    </div>
                  </div>
                  ):(
                    <div className="col-xxl-5 col-xl-5 col-lg-4 col-md-7 col-sm-12">
                    <div className={ (collection.invited.length == 1 ? (collection.aikenCourse ? ("bg-collection-aiken-normal"):("bg-collection-normal")) : (collection.aikenCourse ? ("bg-collection-aiken-multisig"):("bg-collection-multisig")))+" card card-collection card-classic" }>
                      <div className="card-body card-classic-max-height d-flex justify-content-start">
                        <img
                            className="mr-3 rounded-circle mr-0 mr-sm-3"
                            src={ collection.invited.length == 1 ? (collection.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalImage)) : (collection.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigImage)) }
                            width="50"
                            height="50"
                            alt=""
                        />
                        <h4 className="text-capitalize">{collection.name}</h4>  
                      </div>
                      <div className="d-flex justify-content-between m-3">
                        <div className="align-content-center mt-4">                    
                          <ul>
                            <li className="d-flex justify-content-start">
                              <img
                                className="mr-2"
                                src={ collection.invited.length == 1 ? (collectionNormalIcon) : (collectionMultisigIcon) }
                                width="25"
                                height="25"
                                alt=""
                              />
                            { collection.invited.length == 1 ?  (<p className="pt-1">Simple</p>) :  (<p className="pt-1">Multisig</p>) }
                            </li>
                            <li className="d-flex justify-content-start">                              
                              {wallet.stake_address == collection.owner ? (
                                <>
                                  <img
                                    className="mr-2"
                                    src={ collectionOwnerIcon }
                                    width="25"
                                    height="25"
                                    alt=""
                                  />
                                  <p className="pt-1">Owner</p>
                                </>
                              ):(
                                <>
                                  <img
                                    className="mr-2"
                                    src={ collectionInvitedIcon }
                                    width="25"
                                    height="25"
                                    alt=""
                                  />
                                  <p className="pt-1">Ivited</p> 
                                </>
                              )}                              
                            </li>
                          </ul>            
                        </div>
                        <div className="align-content-center mt-5">                                
                         
                        </div> 
                      </div>
                    </div>
                  </div>
                  )}
                  
                  {/* COLLECTION DETAILS */}
                  <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-12">
                    <div className="card card-classic">
                      <div className="card-header">
                        <h4 className="card-title">Collection Details</h4>                     
                      </div>                      
                      <div className="card-body card-classic-max-height-title">    
                      { loading ? (
                        <div className="loading-card">
                          <img                        
                            src={loadingGif}
                            width="35"
                            height="35"
                            alt=""
                          />
                        </div>
                      ):(
                        <PerfectScrollbar>
                          <div className="pr-4">
                          <p className="m-0 small gray">Collection ID</p>
                          <p className="m-0 mb-2">{collection.collectionId}</p>
                          <p className="m-0 small gray">Policy ID</p>
                          <p className="m-0 mb-2">{collection.policyId}</p>
                          <p className="m-0 small gray">Policy Hash</p>
                          <p className="m-0 mb-2">{collection.policyHash}</p>                     
                          <p className="m-0 small gray">Description</p>
                          <p className="m-0 mb-3">{collection.description}</p>
                          <p className="m-0 small gray">Created</p>
                          <p className="m-0 mb-2">{collection.createdAt}</p>
                          <p className="m-0 small gray">Updated</p>
                          <p className="m-0 mb-2">{collection.updatedAt}</p>
                          </div>
                        </PerfectScrollbar>  
                      )}
                        
                      </div>                        
                    </div>
                  </div>
                  {/* TOKEN */}
                  { collection && !loading ? (
                      collection.tokens.map(t => {
                        console.log(t);
                        return (
                          <div key={t.soulboundId} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 card-token-select">
                            <div className="card card-small">
                              <div className="card-token">
                            
                                <div className="card-body top-area d-flex cursor-pointer" onClick={()=>viewToken(t, collection)}>
                                  <div className="d-flex align-items-center">
                                    <img
                                      className="mr-3 mr-0 mr-sm-3"
                                      src={ collection.invited.length == 1 ? (collection.aikenCourse ? (tokenAikenNormal):(tokenSoulNormal)) : (collection.aikenCourse ? (tokenAikenMultisig):(tokenSoulMultisig)) }
                                      width="100"
                                      height="100"
                                      alt=""
                                    />
                                    <div className="media-body">
                                      <h4 className="mb-0 capitalize">{t.name}</h4>
                                      {/* <p className="mb-0">Text</p> */}
                                    </div>
                                  </div>
                                </div>
                                <div className="bottom-area border-top align-content-center">
                                  <div className="card-body d-flex justify-content-between">
                                    <div className="d-flex justify-content-start">
                                      <div className="align-content-center token-status mr-1">
                                        { t.burnTx ? (                                        
                                          <span className="not-verified">
                                            <i className="icofont-close-line" title="Burned"></i>
                                          </span>
                                        ) :(
                                          <span className="verified">
                                            <i className="icofont-check-alt" title="Active"></i>
                                          </span>                                        
                                        )}
                                      </div>
                                      <div className="align-content-center token-status">
                                      { t.claimUtxo ? ( 
                                          <img
                                            title="Claimed"
                                            className="btn-primary p-1 rounded-circle"
                                            src={ collectionOwnerIcon }
                                            width="30"
                                            height="30"
                                            alt=""
                                          />                                                                               
                                        ):(  
                                          <img
                                             title="Not claimed"
                                             className="btn-secondary p-1 rounded-circle"
                                             src={ collectionOwnerIcon }
                                             width="30"
                                             height="30"
                                             alt=""
                                          />                                                                                    
                                        ) }
                                      </div> 
                                    </div>
                                    <div className="align-content-center">
                                      { !t.burnTx && (
                                        <button className="btn btn-danger btn-small float-right" onClick={() => burnSoulToken(t)}>
                                        Burn
                                        </button>
                                      ) }
                                    </div>                 
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <div className="loading-card">
                          <img                        
                            src={loadingGif}
                            width="35"
                            height="35"
                            alt=""
                          />
                        </div>
                  )}
                      {/* <div className="col-xxl-9 col-xl-8 col-lg-6 col-md-6">
                        <div className="card card-classic">
                            { collection && (
                                <>
                                <div className="card-header">
                                    <h4 className="card-title">{collection.name}</h4>
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
                                            {collection.tokens.map(t => {
                                                return (
                                                    <tr key={t.soulboundId} >
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
                                                        <div className="d-flex flex-column">
                                                            <span>{t.name}</span>
                                                            <span>Mint Tx: {t.mintUtxo?.txHash || ''}</span>
                                                            <span>Claim Tx: {t.claimUtxo?.txHash || ''}</span>
                                                            <span>Burn Tx: { t.burnTx || '' }</span>
                                                        </div> 
                                                    </td>                      
                                                    <td className="table-press-icon">
                                                      { !t.burnTx && (
                                                        <Link to="#" className="table-link" onClick={() => burnSoulToken(t)}>
                                                        <span className="dark">
                                                          <i className="icofont-trash"></i>
                                                        </span>
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
                                </>
                            ) }
                        </div>
                      </div> */}

                      

                    </div>
                    </>
            
            
        </Layout>
    )
}

export default Collection;