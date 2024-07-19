import { Link, useParams } from "react-router-dom";
import { get, updateToken } from "../../services/collection.service";
import Layout from "../layout/layout";
import eternlWallet from "../../images/wallets/eternl.jpg";
import { useEffect, useState } from "react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { burnToken } from "../../utils/util";

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
        <Layout>
            { loading && (<p>Loading...</p>) }
            { error && (<p>Error loading collection: {error.message}</p>) }
            { !loading && (
                <div className="row">
                      <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
                        <div className="card card-create bg-soulbound card-classic">
                          <div
                            className="card-body card-classic-max-height"
                            onClick={createSoulToken}
                          >
                            <h4>CREATE<span> SOULBOUND Token</span></h4>               
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
                            <div className="align-content-center mt-4">
                                { !wallet && <button  className="btn btn-gradient btn-small" onClick={showCardanoWallet}>Connect</button> }
                                { wallet && <button  className="btn btn-danger btn-small" onClick={showCardanoWallet}>Change Wallet</button> }
                            </div> 
                          </div>
                        </div>
                      </div>

                      <div className="col-xxl-9 col-xl-8 col-lg-6 col-md-6">
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
                      </div>
                    </div>
            )}
        </Layout>
    )
}

export default Collection;