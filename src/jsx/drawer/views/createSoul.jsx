import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { useNavigate } from 'react-router-dom';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { buildCollectionContracts, buildPolicy, generateNonce, getAddressPaymentKeyHash, getStakeAddress, readValidators } from '../../../utils/util';
import { insert } from '../../../services/collection.service';

export default function CreateSoul() {
  const { cardano: { wallet } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const [event, setEvent] = useState(false);
  const [streamer, setStreamer] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [aikenCourse, setAikenCourse] = useState(false);
  const [multisig, setMultisig] = useState(false);
  const [signers, setSigners] = useState(['']);
 
  const toggleAikenCourse = () => {
    if (!aikenCourse){
      setAikenCourse(true)
    } else {
      setAikenCourse(false)
    }
  }; 

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };
  


  const handleAddSigner = () => {
    setSigners([...signers, '']);
  };

  const handleRemoveSigner = (index) => {
    const newSigners = signers.filter((_, i) => i !=== index);
    if (newSigners.length === 0) {
      setSigners(['']);
      setMultisig(false);
    } else {
      setSigners(newSigners);
    }
  };

  const handleSignerChange = (index, event) => {
    const newInputs = signers.map((input, i) => 
      i ==== index ? event.target.value : input
    );
    setSigners(newInputs);
  };

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create collection SC
    const validators = readValidators();
    console.log('Validators', validators);

    const addr = wallet.address;
    const ownerDetails = wallet.utils.getAddressDetails(addr);
    const signerKey = ownerDetails.paymentCredential.hash;
    const owner = wallet.stake_address;
    const keys = [signerKey];
    const invited = [{ user: owner, keyHash: signerKey, addr: ownerDetails.address.hex, signature: '' }];
    if (multisig) {
      const keyHashes = [];
      // TODO: validate signers
      for (const signer of signers) {
        const stake = getStakeAddress(signer);
        const details = wallet.utils.getAddressDetails(signer);
        const keyHash = details.paymentCredential.hash;
        const addrHex = details.address.hex;
        invited.push({user: stake, keyHash: keyHash, addr: addrHex, signature: ''});
        keyHashes.push(keyHash);
      }
      keys.push(...keyHashes);
    }
    const policy = buildPolicy('all', { signers: keys});

    const collection = buildCollectionContracts(validators.mint.script, validators.redeem.script, wallet.utils, policy);
    const { collectionId } = await insert(owner, { ...collection, name, symbol, description, owner, policy, invited, aikenCourse });
    closeDrawer();
    // navigate(`/collection/${collectionId}`);
    navigate(`/collections/souls`);
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
              Create SOUL COLLECTION
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
                placeholder="Symbol"
                name="symbol"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
              />
            </div>
            <div className="col-12">
              {/* <label className="form-label">Description</label> */}
              <input
                type="text"
                className="form-control"
                placeholder="Description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="col-12">
              {/* <label className="form-label">Type</label> */}
              <select className="form-select" onChange={(event) => setMultisig(event.target.value === 'multisig')}>
                <option value="">Choose a Type...</option>
                <option value="normal">Normal</option>
                <option value="multisig">Multisig</option>
              </select>
              { multisig && (
              <div>

                {signers.map((addr, index) => (
                  <div key={index} className='pt-2'>
                    <InputGroup className="mb-3">
                      <Form.Control
                        placeholder="addr..."
                        value={addr}
                        onChange={(e) => handleSignerChange(index, e)}
                      />
                      <Button 
                        type="button"
                        className='btn btn-close align-content-center'
                        onClick={() => handleRemoveSigner(index)}
                      ></Button>
                    </InputGroup>
                  </div>
                ))}
                <Button 
                  type="button" 
                  className="btn btn-primary btn-block"
                  onClick={handleAddSigner}
                >
                  Add User
                </Button>
              </div>
              )}
            </div> 
            <hr className='col-12 my-4 mb-2'></hr>
            <div className="col-10">
              <h6
                className="py-2"                
              >
                Is this for the Smart Contracts Course?
              </h6> 
            </div>  
            <div className="col-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="flexSwitchCheckDefault"
                  name='aikenCourse'
                  onChange={() => toggleAikenCourse()}
                />                  
              </div>
            </div>             
            <hr className='col-12 my-3'></hr>            
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
