import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { getAllEventsService } from '../../../services/paima.service';
import { mintToken } from "../../../utils/poapContractInteractions";
import { createOwnerService } from '../../../services/paima.service';
import { mvpSmartContractService } from '../../../services/mvp-smart-contract.service';
import { loadingFunction, errorFunction, succesfullBlockchainCreation } from '../../toasts/sweetAlerts';

export default function CreatePoap() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventId: '',
    issuerId: '',
    to: ''
  });

  const { event, ethereum: { provider }, poapOwner } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [searchParams] = useSearchParams();

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };

  const navigate = useNavigate();

  useEffect(() => {
    // If we have an event from context (clicked from event card), use it
    if (event && event.event) {
      setSelectedEvent(event.event);
      setFormData({
        eventId: event.event.eventId,
        issuerId: event.event.issuerId,
        to: provider?.address || ''
      });
    }
    
    // Load all events for selection
    loadEvents();
  }, [event, provider]);

  // New useEffect to handle URL parameters after events are loaded
  useEffect(() => {
    if (events.length > 0) {
      const eventIdFromUrl = searchParams.get('eventId');
      
      if (eventIdFromUrl && !selectedEvent) {
        const eventFromUrl = events.find(evt => evt.eventId == eventIdFromUrl);
        if (eventFromUrl) {
          console.log("🚀 ~ URL Event Selection ~ eventFromUrl:", eventFromUrl);
          handleEventSelect(eventFromUrl);
        }
      }
    }
  }, [events, selectedEvent, searchParams]);

  const loadEvents = async () => {
    try {
      const allEvents = await getAllEventsService();
      console.log("🚀 ~ loadEvents ~ allEvents:", allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const handleEventSelect = (selectedEvent) => {
    console.log("🚀 ~ handleEventSelect ~ selectedEvent:", selectedEvent);
    setSelectedEvent(selectedEvent);
    setFormData({
      eventId: selectedEvent.eventId,
      issuerId: selectedEvent.issuerId,
      to: provider?.address || ''
    });
  };

  const updatePoaps = (poaps) => {
    dispatch({
      type: "UPDATE_POAPS",
      payload: poaps,
    });
  };

  const updateOwner = (owner) => {
    dispatch({
      type: "UPDATE_OWNER",
      payload: owner,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!provider || !provider.address) {
      errorFunction(
        "Wallet Required",
        "Please connect your Ethereum wallet first.",
        ""
      );
      return;
    }

    if (!formData.eventId || !formData.issuerId) {
      errorFunction(
        "Event Selection Required",
        "Please select an event first.",
        ""
      );
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create owner if doesn't exist
      // if (!poapOwner) {
      //   loadingFunction("Creating Owner", "Setting up your account...", "");
        
      //   const newOwner = await createOwnerService({
      //     address: provider.address.toLowerCase(),
      //   });
        
      //   if (!newOwner) {
      //     errorFunction(
      //       "Error",
      //       "Failed to create owner account. Please try again.",
      //       ""
      //     );
      //     return;
      //   }
        
      //   updateOwner(newOwner);
      // }

      // Step 2: Mint POAP token on blockchain
      loadingFunction("Minting POAP", "Minting your POAP token...", "");
      const result = await mvpSmartContractService.mintToken(
        parseInt(selectedEvent.issuerId),
        parseInt(selectedEvent.eventId),
        provider.address
      );

      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        succesfullBlockchainCreation(
          "Token Minted Successfully",
          `Transaction: ${result.txHash}`,
          explorerUrl
        );
        // navigate("/mvp");
      } else {
        errorFunction(
          "Mint Failed",
          `Failed to mint token: ${result.error}`
        );
      }
      // const minting = await mintToken(
      //   parseInt(formData.issuerId),
      //   parseInt(formData.eventId),
      //   formData.to || provider.address,
      //   provider
      // );
      
      // if (!minting) {
      //   errorFunction(
      //     "Error",
      //     "Failed to mint POAP token. Please try again.",
      //     ""
      //   );
      //   return;
      // }

      // succesfullBlockchainCreation(
      //   "POAP Minted Successfully",
      //   `POAP token minted for event: ${selectedEvent?.title || 'Selected Event'}`,
      //   `https://amoy.polygonscan.com/tx/${minting.transactionHash}`
      // );

      closeDrawer();
      navigate("/poap-management");
      
    } catch (error) {
      console.error("Error minting POAP:", error);
      errorFunction(
        "Error",
        "Failed to mint POAP token. Please try again.",
        ""
      );
    } finally {
      setLoading(false);
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
            Create POAP Token
          </h4>
        </div>          
      </div>      
      <div className="drawer-body">
        <form
          name="createPoapForm"
          className="signin_validate row g-3"
          onSubmit={handleSubmit}
        >
          <div className="col-12">
            <label className="form-label">Select Event</label>
            <select 
              className="form-select"
              value={formData.eventId}
              onChange={(e) => {
                const eventId = e.target.value;
                const selectedEvent = events.find(evt => evt.eventId == eventId);
                handleEventSelect(selectedEvent);
              }}
              required
            >
              <option value="">Choose an event...</option>
              {events.map(event => (
                <option key={event.eventUuid} value={event.eventId}>
                  (EVENT: {event.eventId} maxSupply: {event.maxSupply})
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              <div className="col-12">
                <div className="card card-small">
                  <div className="card-body">
                    <h6 className="card-title">{selectedEvent.title}</h6>
                    <p className="card-text small text-muted">
                      {selectedEvent.description}
                    </p>
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Issuer ID:</small>
                        <p className="mb-0">{selectedEvent.issuerId}</p>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Event ID:</small>
                        <p className="mb-0">{selectedEvent.eventId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <label className="form-label">Recipient Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter recipient address"
                  value={formData.to}
                  onChange={(e) => setFormData({...formData, to: e.target.value})}
                  required
                />
                <small className="text-muted">
                  Leave empty to mint to your own address: {provider?.address}
                </small>
              </div>
            </>
          )}

          <hr className='col-12 my-4'></hr>
        </form>
      </div>
      <div className='drawer-footer'>
        <button 
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
          disabled={loading || !formData.eventId}
        >
          {loading ? 'Minting...' : 'Mint POAP'}
        </button>
      </div>
    </div>
  );
}
