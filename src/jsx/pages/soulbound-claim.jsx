import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAll, getClaimableTokens, updateToken } from "../../services/collection.service";
import Layout from "../layout/layout";
import eternlWallet from "../../images/wallets/eternl.jpg";
import threeDots from "../../icons/svg/three-dots.svg";
import { useEffect, useState } from "react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { claimToken } from "../../utils/util";

const SoulboundClaim = () => {
    const { cardano: { wallet } } = useDrawer();
    const dispatch = useDrawerDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        setTokens(tokens.map((t) => t.soulboundId != token.soulboundId ? t : {...token, ...updatedToken}))
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
        <Layout activeMenu={3}>
            { loading && (<p>Loading...</p>) }
            { error && (<p>Error loading collection: {error.message}</p>) }
            { !loading && (
                <div className="row">
                      <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
                        <div className="card card-create bg-soulbound card-classic">
                          <div
                            className="card-body card-classic-max-height"
                          >
                            <h4>CLAIM<span> SOULBOUND Token</span></h4>               
                          </div>
                          <div className="d-flex justify-content-between m-3">
                                <div className="align-content-center mt-4">                    
                                <span className="verified">
                                    { wallet && <i className="icofont-check-alt"></i> }
                                    { !wallet && <i className="icofont-close-line"></i> }
                                </span>     
                                </div>
                            <div className="align-content-center mt-4">
                                { !wallet && <button className="btn btn-gradient btn-small" onClick={showCardanoWallet}>Connect</button> }
                                { wallet && <button  className="btn btn-danger btn-small" onClick={showCardanoWallet}>Change Wallet</button> }
                            </div> 
                          </div>
                        </div>
                      </div>
              
                      <div className="col-xxl-9 col-xl-8 col-lg-6 col-md-6">
                        <div className="card card-classic">
                          <div className="card-header">
                            <h4 className="card-title">Tokens</h4>
                          </div>
                          <div className="card-body card-classic-max-height-title">
                          <div className="table-responsive">
                              <table className="table table-striped table-small responsive-table">
                                <tbody>
                                {tokens.map(t => {
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
                                                <span>{t.collection.name}</span>
                                                <span>{t.name}</span>
                                                <span>Mint Tx: {t.mintUtxo.txHash}</span>
                                                <span>Claim Tx: {t.claimUtxo?.txHash || ''}</span>
                                            </div> 
                                          </td>                      
                                          <td className="table-press-icon">
                                            <Link className="table-link" onClick={() => claimSoulToken(t)}>
                                              <img
                                                src={threeDots}
                                                width="20"
                                                height="40"
                                                alt=""
                                              />
                                            </Link>
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
            )}
        </Layout>
    )
}

export default SoulboundClaim;