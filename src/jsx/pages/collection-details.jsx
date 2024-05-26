import { Link, useParams } from "react-router-dom";
import { get } from "../../services/collection.service";
import Layout from "../layout/layout";
import eternlWallet from "../../images/wallets/eternl.jpg";
import threeDots from "../../icons/svg/three-dots.svg";
import { useEffect, useState } from "react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { Button } from "react-bootstrap";

const Collection = () => {
    const { id } = useParams();
    const { cardano } = useDrawer();
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

    useEffect(() => {
        const fetchData = async () => {
          try {
            const data = await get(id);
            setCollection(data);
          } catch (err) {
            setError(err);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, [id]);

    return (
        <Layout>
            { loading && (<p>Loading...</p>) }
            { error && (<p>Error loading collection: {error.message}</p>) }
            { collection && (
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
                            { cardano.wallet && (
                                <div className="align-content-center mt-4">                    
                                <span className="verified">
                                    <i className="icofont-check-alt"></i>
                                </span>     
                                </div>
                            )}
                            <div className="align-content-center mt-4">
                                { !cardano.wallet && (
                                    <button  className="btn btn-gradient btn-small" onClick={showCardanoWallet}>Connect</button>
                                ) }
                            </div> 
                          </div>
                        </div>
                      </div>
              
                      <div className="col-xxl-9 col-xl-8 col-lg-6 col-md-6">
                        <div className="card card-classic">
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
                                        <tr key={t.id} >
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
                                                <span>{t.id}</span>
                                            </div> 
                                          </td>                      
                                          <td className="table-press-icon">
                                            <Link to="#" className="table-link">
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

export default Collection;