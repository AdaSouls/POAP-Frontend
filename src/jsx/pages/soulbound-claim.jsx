import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAll, getClaimableTokens, updateToken } from "../../services/collection.service";
import Layout from "../layout/layout";
import walletStatus from "../../images/collections/wallet-status.png";
import { useEffect, useState } from "react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { claimToken } from "../../utils/util";
import tokenAikenNormal from "../../images/svg/aiken-normal.svg";
import tokenAikenMultisig from "../../images/svg/aiken-multisig.svg";
import tokenSoulNormal from "../../images/svg/soul-normal.svg";
import tokenSoulMultisig from "../../images/svg/soul-multisig.svg";
import collectionOwnerIcon from "../../icons/svg/collection-owner.svg";

const SoulboundClaim = () => {
    const { cardano: { wallet } } = useDrawer();
    const dispatch = useDrawerDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const viewToken = ( token, collection ) => {
      const getToken = {token, collection};
      dispatch({ type: 'VIEW_TOKEN', payload: getToken });
    }; 

    const claimSoulToken = async (token) => {
      const provider = wallet.provider;
      const addr = wallet.address;
  
      const { collectionId, policyId, policyHash, smartContract, redeem } = token.collection;
      const beneficiary = wallet.utils.getAddressDetails(token.beneficiary).paymentCredential.hash;

      const utxo = (await provider.wallet.getUtxos())[0];
      try {
        const { txSigned, claimUtxo } = await claimToken(token.name, token.metadata, policyId, policyHash, beneficiary, smartContract, redeem, token.mintUtxo, utxo, provider);
        console.log('Tx Cbor:', txSigned.toString());
        const updatedToken = await updateToken(collectionId, token.soulboundId, { claimUtxo });
        setTokens(tokens.map((t) => t.soulboundId !== token.soulboundId ? t : {...token, ...updatedToken}))
        const txId = await txSigned.submit();
        console.log('Tx Id:', txId);
        const success = await provider.awaitTx(txId);
        console.log('Success?', success);
      } catch(err) {
        console.log('Wallet submit tx error:', err);
      }
    }; 

    const showCardanoWallet = () => {
        dispatch({
          type: 'SHOW_CARDANO_WALLET'
        });
    };

    useEffect(() => {
        const fetchData = async () => {
          try {
            if (!wallet) {
              setTokens([]);
            } else {
              const _tokens = await getClaimableTokens(wallet.stake_address);
              setTokens(_tokens);
            }
          } catch (err) {
            setError(err);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }, [wallet]);

    return (
        <Layout activeMenu={4}>
        { loading && ( <p>Loading...</p>) }
        { error && (<p>Error loading collection: {error.message}</p>) }
        { !loading && (
            <div className="row">
                  <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
                    <div className="card card-create bg-soulbound card-classic">
                      <div className="card-body card-classic-max-height cursor-default" >
                        <h4>CLAIM <span>SOULBOUND TOKEN</span></h4>                             
                        <p className="text-white mt-5">A soulbound token is a type of digital token that is 
                          non-transferable and is permanently tied to a specific individual 
                          or entity.</p>                           
                        <p className="text-white mt-3">They can represent credentials, achievements, affiliations or attributes.</p>       
                      </div>
                      <div className="d-flex justify-content-between m-3">
                            <div className="align-content-center mt-4">                    
                            <span className="verified">
                                { wallet && <i className="icofont-check-alt"></i> }
                                { !wallet && <i className="icofont-close-line"></i> }
                            </span>     
                            </div>
                        <div className="align-content-center mt-4">
                            { !wallet && <button className="btn btn-white btn-small" onClick={showCardanoWallet}>Connect</button> }
                            { wallet && <button  className="btn btn-danger btn-small" onClick={showCardanoWallet}>Change Wallet</button> }
                        </div> 
                      </div>
                    </div>
                  </div>
               <div className="col-xxl-9 col-xl-8 col-lg-6 col-md-6">
                    <div className="card card-classic">
                      <div className="card-header">
                        <h4 className="card-title">Claim</h4>
                      </div>
                      <div className="card-body card-classic-max-height-title">
                      <div className="table-responsive">
                          <table className="table table-striped table-small responsive-table">
                            <tbody>
                            { wallet ? (
                              tokens.filter(claimUtxo => !claimUtxo.claimUtxo).map(t => {
                                return (
                                  <tr key={t.soulboundId} >
                                    <td className="table-image">                      
                                      <img
                                        className=""
                                        src={ t.collection.invited.length === 1 ? (t.collection.aikenCourse ? (tokenAikenNormal):(tokenSoulNormal)) : (t.collection.aikenCourse ? (tokenAikenMultisig):(tokenSoulMultisig)) }
                                        width="50"
                                        height="50"
                                        alt=""
                                      />
                                    </td>                      
                                    <td>
                                      <div className="d-flex justify-content-start">                          
                                        <div className=""><p className="m-0 small gray">Collection</p><h5 className="m-0">{t.collection.name}</h5></div>  
                                      </div> 
                                    </td>  
                                    <td>
                                      <div className="d-flex justify-content-start">              
                                        <div className=""><p className="m-0 small gray">Name</p><h5 className="m-0">{t.name}</h5></div>
                                      </div> 
                                    </td>
                                    <td>
                                      
                                    </td>                       
                                    <td className="table-press-icon">
                                      <Link className="btn btn-icon btn-primary px-2" onClick={() => claimSoulToken(t)}>
                                        Claim
                                      </Link>
                                    </td>
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
                            { wallet && (
                              tokens.filter(claimUtxo => !claimUtxo.claimUtxo) === '' && (
                                <tr>
                                  <td>                      
                                  <div className="d-flex justify-content-start">
                                        <p className="align-content-center m-0 py-3 px-1">No tokens to claim</p>
                                    </div>
                                  </td> 
                                </tr>
                              )
                            )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
               { tokens.filter(claimUtxo => claimUtxo.claimUtxo  ).map(t => {
                    console.log(t);
                    return (
                      <div key={t.soulboundId} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 card-token-select">
                        <div className="card card-small">
                          <div className="card-token">
                        
                            <div className="card-body top-area d-flex cursor-pointer" onClick={()=>viewToken(t, t.collection)}>
                              <div className="d-flex align-items-center">
                                <img
                                  className="mr-3 mr-0 mr-sm-3"
                                  src={ t.collection.invited.length === 1 ? (t.collection.aikenCourse ? (tokenAikenNormal):(tokenSoulNormal)) : (t.collection.aikenCourse ? (tokenAikenMultisig):(tokenSoulMultisig)) }
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
                                  {/* { t.claimUtxo ? ( 
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
                                    ) } */}
                                  </div> 
                                </div>
                                <div className="align-content-center">
                                  <h5 className="p-0 m-0 capitalize">{t.collection.name}</h5>
                                </div>                 
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
        )}
        </Layout>
    )
}

export default SoulboundClaim;