import { useState } from 'react';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import { mintToken } from '../../../utils/util';
import { addSoulbound } from '../../../services/token.service';

export default function CreateSoulToken() {
  const { cardano: { wallet }, collection } = useDrawer();
  const dispatch = useDrawerDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const placeholderObj = {
    name: "Charles Hoskinson",
    status: "Passed"
  }

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [metadata, setMetadata] = useState(JSON.stringify(placeholderObj, null, 4));
  const [aikenCourseApproved, setAikenCourseApproved] = useState(false);
  const [isMetadataValidJson, setIsMetadataValidJson] = useState(true);

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  

  const toggleAikenCourseApproved = () => {
    console.log("toggle");
    if (!aikenCourseApproved){
      setAikenCourseApproved(true)
    } else {
      setAikenCourseApproved(false)
    }
  }; 

  const validateJsonFormat = (metadata) => {
    try {
      JSON.parse(metadata);
    } catch (e) {
      setIsMetadataValidJson(false);
      return;
    }
    setIsMetadataValidJson(true);
    return;
  }


  const handleSubmit = async (e) => {
    e.preventDefault();

    // mint token
    const provider = wallet.provider;

    const { collectionId, policyId, policyHash, smartContract, mint, invited } = collection;
    const utxo = (await provider.wallet.getUtxos())[0];
    
    const addressDetails = wallet.utils.getAddressDetails(address);
    const beneficiary = addressDetails.paymentCredential.hash;
    const stakeAddress = wallet.utils.credentialToRewardAddress(addressDetails.stakeCredential);

    const _metadata = JSON.parse(metadata || '{}')
    try {
      const signatures = invited.reduce((dict, sig) => ({...dict, [sig.keyHash]: sig.signature}), {});
      const { txComplete, mintUtxo } = await mintToken(name, _metadata, policyId, policyHash, beneficiary, signatures, smartContract, mint, utxo, provider);
      // console.log(txSigned.toString());
      const txSigned = await txComplete.complete();
      console.log('cbor', txSigned.toString());

      const txHash = await txSigned.submit();
      console.log('Tx Id:', txHash);
      const success = await provider.awaitTx(txHash);
      console.log('Success?', success);

      const token = await addSoulbound(collectionId, { mintUtxo, beneficiary: address, beneficiary_stake: stakeAddress, name, metadata: _metadata , aikenCourseApproved });
      collection.tokens.push(token);
      closeDrawer();
      navigate(location.pathname, { replace: true });
      
    } catch (error) {
      console.log('Error', error);
    }
  };
  
  return (
    <div className="d-flex flex-column w-100 h-100 p-3">      
        <div className="drawer-header">
          <div className="d-flex justify-content-start">                  
            <button
              className="btn btn-close align-content-center px-1 mt-2 position-absolute"
              onClick={closeDrawer}
              aria-label="close"
            >                        
            </button>
            <h4            
              className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold"
            >
              Create SOULBOUND TOKEN
            </h4>
          </div>          
        </div>      
        <div className="drawer-body">
          <form
            name="myform"
            className="signin_validate row g-3"
            onSubmit={handleSubmit}
          >
            <div className="col-12">
              {/* <label className="form-label">Name</label> */}
              <input
                type="text"
                className="form-control"
                placeholder="Name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="col-12">
              {/* <label className="form-label">Symbol</label> */}
              <input
                type="text"
                className="form-control"
                placeholder="addr..."
                name="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
            <hr className='col-12 my-4 mb-2'></hr>
            <div className="col-10">
              <h6
                className="py-2"                
              >
                Has the student passed the final exam?
              </h6> 
            </div>  
            <div className="col-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="flexSwitchCheckDefault"
                  name='aikenCourseApproved'
                  onChange={() => toggleAikenCourseApproved()}
                />                  
              </div>
            </div>             
            <hr className='col-12 my-3'></hr>            
            <div className="col-12">
            <Form.Label>Metadata</Form.Label>
              <Form.Control
                as="textarea"
                placeholder={JSON.stringify(placeholderObj, null, 2)}
                style={{ height: '100px' }}
                value={metadata}  
                onChange={(event) => { setMetadata(event.target.value); validateJsonFormat(event.target.value); }}
              />
            {/* <label>
              Metadata:
              <textarea value={metadata}  onChange={(event) => setMetadata(event.target.value)} />
            </label> */}
            </div>
            {isMetadataValidJson ? <p>Valid JSON</p> : <p>Invalid JSON</p>}
            <hr className='col-12 my-4 mt-3'></hr>                      
            <div className='drawer-footer'>
              <Button type="submit" className="btn btn-gradient btn-block">
                Create
              </Button>
            </div>
          </form>
        </div>
    </div>
  );
}
