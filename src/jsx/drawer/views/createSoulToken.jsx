import { useState } from 'react';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import { mintToken } from '../../../utils/util';
import { update } from '../../../services/collection.service';

export default function CreateSoulToken() {
  const { cardano: { wallet }, collection } = useDrawer();
  const dispatch = useDrawerDispatch();
  const location = useLocation();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [metadata, setMetadata] = useState('');


  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    // mint token
    const provider = wallet.provider;
    const addr = wallet.address;

    const { id, policyId, policyHash, lockAddress, mint } = collection;
    
    const utxo = (await provider.wallet.getUtxos())[0];
    
    const beneficiary = wallet.utils.getAddressDetails(address).paymentCredential.hash;
    const signerKey = wallet.utils.getAddressDetails(addr).paymentCredential.hash;
    const _metadata = JSON.parse(metadata || '{}')
    const txSigned = await mintToken(name, _metadata, policyId, policyHash, beneficiary, signerKey, lockAddress, mint, utxo, provider);
    console.log(txSigned.toString());
    const txId = await txSigned.submit();
    const success = await provider.awaitTx(txId);
    console.log('Success?', success);
    const tokens = collection.tokens;
    tokens.push({ id: txId, beneficiary: address, name, metadata: _metadata });
    update(id, { tokens });
    closeDrawer();
    navigate(location.pathname, { replace: true });
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
              Create SOUL Token
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
            <div className="col-12">
            <Form.Label>Metadata</Form.Label>
              <Form.Control
                as="textarea"
                placeholder="{}"
                style={{ height: '100px' }}
                value={metadata}  onChange={(event) => setMetadata(event.target.value)}
              />
            {/* <label>
              Metadata:
              <textarea value={metadata}  onChange={(event) => setMetadata(event.target.value)} />
            </label> */}
            </div>
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
