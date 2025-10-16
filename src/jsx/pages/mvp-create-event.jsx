import React, { useState, useEffect } from "react";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";
import { useNavigate } from "react-router-dom";
import { 
  informationFunction, 
  errorFunction, 
  succesfullBlockchainCreation
} from "../toasts/sweetAlerts";

const MVPCreateEvent = () => {
  const { ethereum: { provider } } = useDrawer();
  const { issuerId, isIssuer, isLoading } = useUserRoles();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    issuerId: "",
    eventId: "",
    maxSupply: "",
    mintExpiration: "",
    eventOrganizer: "",
  });

  // Auto-populate issuerId when it becomes available
  useEffect(() => {
    if (issuerId && !formData.issuerId) {
      setFormData(prev => ({
        ...prev,
        issuerId: issuerId.toString()
      }));
    }
  }, [issuerId]);

  // Auto-populate eventOrganizer with wallet address
  useEffect(() => {
    if (provider?.address && !formData.eventOrganizer) {
      setFormData(prev => ({
        ...prev,
        eventOrganizer: provider.address
      }));
    }
  }, [provider?.address]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!provider || !provider.address) {
      informationFunction(
        "Wallet Required",
        "Please connect your Ethereum wallet first."
      );
      return;
    }

    if (!formData.eventId || !formData.issuerId) {
      informationFunction(
        "Event Selection Required",
        "Please select an event first."
      );
      return;
    }

    try {
      setLoading(true);
      
      const result = await mvpSmartContractService.createEvent(
        parseInt(formData.issuerId),
        parseInt(formData.eventId),
        parseInt(formData.maxSupply),
        formData.mintExpiration ? parseInt(formData.mintExpiration) : 0,
        formData.eventOrganizer || provider.address
      );

      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        succesfullBlockchainCreation(
          "Event Created Successfully",
          `Transaction: ${result.txHash}`,
          explorerUrl
        );
        navigate("/mvp");
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      errorFunction(
        "Event Creation Failed",
        `Failed to create event: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to create events.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenu={1}>
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-body">
              <h4>Create New Event</h4>
              <p className="text-muted">
                Create a new POAP event using only smart contracts.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="issuerId">Issuer ID</label>
                  <input
                    type="number"
                    className="form-control"
                    id="issuerId"
                    name="issuerId"
                    value={formData.issuerId}
                    onChange={handleInputChange}
                    required
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="eventId">Event ID</label>
                  <input
                    type="number"
                    className="form-control"
                    id="eventId"
                    name="eventId"
                    value={formData.eventId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="maxSupply">Max Supply</label>
                  <input
                    type="number"
                    className="form-control"
                    id="maxSupply"
                    name="maxSupply"
                    value={formData.maxSupply}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="mintExpiration">Mint Expiration (Unix timestamp, 0 for no expiration)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="mintExpiration"
                    name="mintExpiration"
                    value={formData.mintExpiration}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="eventOrganizer">Event Organizer Address (leave empty to use your address)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="eventOrganizer"
                    name="eventOrganizer"
                    value={formData.eventOrganizer}
                    onChange={handleInputChange}
                    placeholder={provider.address}
                  />
                </div>

                <div className="form-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creating Event..." : "Create Event"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ml-2"
                    onClick={() => navigate("/mvp")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MVPCreateEvent;