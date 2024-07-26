import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import waiting from "../../../images/waiting.png";

export default function ViewToken() {
  const { token } = useDrawer();
  const dispatch = useDrawerDispatch();

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  

  console.log(token);
  
  return (
    <div className="d-flex flex-column w-100 h-100 p-3">      
        <div className="drawer-header">
            <div className="d-flex justify-content-start">                  
                <button className="btn btn-close align-content-center px-1 mt-2 position-absolute" onClick={closeDrawer} aria-label="close" ></button>
                <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold capitalize">{token.name || ''} </h4>
            </div>          
        </div>      
        <div className="drawer-body">
            <p>Aiken Course Approved: {token.aikenCourseApproved || false}</p>
            <p>beneficiary: {token.beneficiary || ''}</p>
            <p>burnTx: {token.burnTx || ''}</p>  
            <p>Mint Tx: {token.mintUtxo.txHash || ''}</p>  
            <p>Claim Tx: {token.claimUtxo?.txHash || ''}</p>   
            <p>collectionId: {token.collectionId || ''}</p>
            {/* <p>Metadata: {token.metadata || ''}</p>*/}
        </div>
        {/* <div className='drawer-footer'>
          <Link to={"#"} className="btn btn-gradient btn-block">
            Create
          </Link>
        </div> */}
    </div>
  );
}
