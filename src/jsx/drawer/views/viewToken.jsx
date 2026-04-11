import React from 'react';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import collectionNormalImage from "../../../images/svg/collection-normal.svg";
import collectionMultisigImage from "../../../images/svg/collection-multisig.svg";
import collectionAikenNormalIcon from "../../../images/svg/collection-aiken-normal.svg"
import collectionAikenMultisigIcon from "../../../images/svg/collection-aiken-multisig.svg"
import tokenAikenNormal from "../../../images/svg/aiken-normal.svg";
import tokenAikenMultisig from "../../../images/svg/aiken-multisig.svg";
import tokenSoulNormal from "../../../images/svg/soul-normal.svg";
import tokenSoulMultisig from "../../../images/svg/soul-multisig.svg";

export default function ViewToken() {
  const { token } = useDrawer();
  const dispatch = useDrawerDispatch();

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

          {token.collection && (            
            <div className={"card card-button"}>                                 
              <div className="card-body top-area d-flex cursor-default">
                <div className="d-flex align-items-center">
                  <img
                    className="mr-3 rounded-circle wallet-circle mr-0 mr-sm-3"
                    src={ token.collection.invited.length === 1 ? (token.collection.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalImage)) : (token.collection.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigImage)) }
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
                    src={ token.collection.invited.length === 1 ? (token.collection.aikenCourse ? (tokenAikenNormal):(tokenSoulNormal)) : (token.collection.aikenCourse ? (tokenAikenMultisig):(tokenSoulMultisig)) }
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
          {token.collection.aikenCourse && (            
            <div className={"card card-small"}>                                 
              <div className="card-body top-area d-flex cursor-default">
                <div className="d-flex align-items-center">
                  <img
                    className="mr-3 rounded-circle wallet-circle mr-0 mr-sm-3"
                    src={ token.collection.invited.length === 1 ? (token.collection.aikenCourse ? (collectionAikenNormalIcon):(collectionNormalImage)) : (token.collection.aikenCourse ? (collectionAikenMultisigIcon):(collectionMultisigImage)) }
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
          <div className='text-break'>
            <a class="twitter-share-button"
              href="https://twitter.com/intent/tweet?text=This%20is%20a%20test%20tweet"
              data-size="large"
              data-text="custom share text"
              data-url="https://dev.twitter.com/web/tweet-button"
              data-hashtags="example,demo"
              data-via="twitterdev"
              data-related="twitterapi,twitter">
            Share on Twitter
            </a>
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
        
        </div>
        {/* <div className='drawer-footer'>
          <Link to={"#"} className="btn btn-gradient btn-block">
            Create
          </Link>
        </div> */}
    </div>
  );
}
