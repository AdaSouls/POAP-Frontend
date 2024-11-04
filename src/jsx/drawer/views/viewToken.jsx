import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import collectionNormalImage from "../../../images/svg/collection-normal.svg";
import collectionMultisigImage from "../../../images/svg/collection-multisig.svg";
import collectionAikenNormalIcon from "../../../images/svg/collection-aiken-normal.svg"
import collectionAikenMultisigIcon from "../../../images/svg/collection-aiken-multisig.svg"
import tokenAikenNormal from "../../../images/svg/aiken-normal.svg";
import tokenAikenMultisig from "../../../images/svg/aiken-multisig.svg";
import tokenSoulNormal from "../../../images/svg/soul-normal.svg";
import tokenSoulMultisig from "../../../images/svg/soul-multisig.svg";
import PerfectScrollbar from "react-perfect-scrollbar";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { getPinataUrl } from "../../../services/pinata.service";
import loadingGif from "../../../images/loading.gif";
import { TwitterShareButton, XIcon } from 'react-share';

export default function ViewToken() {
  const { token } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [ url, setUrl ] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const getUrl = async() => {  
      setLoading(true);
      const _url = await getPinataUrl(token.token.metadata.image);
      setUrl(_url);        
    }  
    
    if (!url){
      getUrl();
      setTimeout(() => {
        setLoading(false);
      }, 4000);      
    }
    
  }, []);

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  
  
  return (
    <div className="d-flex flex-column w-100 h-100 p-3">      
        <div className="drawer-header">
            <div className="d-flex justify-content-start ">                  
                <button className="btn btn-close align-content-center px-1 mt-2 position-absolute" onClick={closeDrawer} aria-label="close" ></button>
                <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold capitalize">Soulbound Token</h4>
            </div>          
        </div>      
        <div className="drawer-body">
        <PerfectScrollbar>
          {token.collection && (            
            <div className={"card card-button"}>                                 
              <div className="card-body top-area d-flex cursor-default">
                <div className="d-flex align-items-center">
                  <img
                    className="mr-3 rounded-circle wallet-circle mr-0 mr-sm-3"
                    src={ token.collection.invited.length == 1 ? (token.collection.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalImage)) : (token.collection.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigImage)) }
                    width="60"
                    height="60"
                    alt=""
                  /> 
                  <div className="media-body">
                    <p className='m-0 small gray'>Collection</p>
                    <h4 className="mb-0">{token.collection.name}</h4>                    
                  </div>
                </div>
              </div>             
            </div>
          )}
          {token.collection && (   
            <div className={"card card-button"}>                                 
              <div className="card-body top-area d-flex cursor-default">
                <div className="d-flex align-items-center">
                  <img
                    className="mr-3 mr-0 mr-sm-3"
                    src={ token.collection.invited.length == 1 ? (token.collection.aikenCourse ? (tokenAikenNormal):(tokenSoulNormal)) : (token.collection.aikenCourse ? (tokenAikenMultisig):(tokenSoulMultisig)) }
                    width="60"
                    height="60"
                    alt=""
                  /> 
                  <div className="media-body">
                    <p className='m-0 small gray'>Soulbound Token</p>
                    <h4 className="mb-0">{token.token.name}</h4>
                  </div>
                </div>
              </div>             
            </div>
          )}    
               
          { loading && (
            <div className='ipfs-container-loading'> 
              <div className="loading-card">
                <img                        
                  src={loadingGif}
                  width="50"
                  height="50"
                  alt=""
                />
              </div> 
            </div>
          )} 

          <div className='ipfs-container'> 
          { url && (
            token?.token?.metadata?.image ? (                
              <PhotoProvider maskOpacity={0.5} bannerVisible={false}>
                <PhotoView src={url.url}>
                  <img
                  className="cursor-pointer"
                  src={url.url}
                  alt=""
                  />
                </PhotoView>
              </PhotoProvider>               
            ):(
              <p>No image</p>
            )
          )}
          </div>
          
          { url && token?.token?.metadata?.image && (
            <TwitterShareButton url={process.env.PUBLIC_URL + "localhost/diplomas/" + token.token.metadata.image + ".jpg"} title={"Este es mi titulo"} className='mt-2'>
              <XIcon size={32} round={true} />
            </TwitterShareButton>
          )}
          

          <div className='text-break'>  
            <br /><br />
            <h4 className='pb-3 max-width'>Details</h4>
            <p className="m-0 small gray">Soulbound ID</p>
            <p className="m-0 mb-2">{token.token.soulboundId}</p>
            <p className="m-0 small gray">Owner</p>
            <p className="m-0 mb-3">{token.token.beneficiary}</p>
            <p className="m-0 small gray">Mint</p>
            <p className="m-0 mb-2">{token.token.mintUtxo?.txHash || "" }</p>
            <p className="m-0 small gray">Claim</p>
            <p className="m-0 mb-2">{token.token.claimUtxo?.txHash || "Not Claimed" }</p>
            <p className="m-0 small gray">Burn</p>
            <p className="m-0 mb-2">{token.token.burnTx || "Not Burned"}</p>
            <p className="m-0 small gray">Created</p>
            <p className="m-0 mb-2">{token.token.createdAt}</p>
            <p className="m-0 small gray">Updated</p>
            <p className="m-0 mb-2">{token.token.updatedAt}</p>
          </div>
          </PerfectScrollbar>
        </div>
        {/* <div className='drawer-footer'>
          <Link to={"#"} className="btn btn-gradient btn-block">
            Create
          </Link>
        </div> */}
    </div>
  );
}
