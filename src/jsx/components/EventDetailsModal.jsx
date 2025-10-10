import React from 'react';

const EventDetailsModal = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Event Details</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-muted">Event Information</h6>
                <p><strong>Event ID:</strong> {event.eventId}</p>
                <p><strong>Issuer ID:</strong> {event.issuerId}</p>
                <p><strong>Organizer:</strong> {event.eventOrganizer}</p>
                <p><strong>Status:</strong> 
                  <span className={`badge ms-2 ${event.isExpired ? 'bg-danger' : 'bg-success'}`}>
                    {event.isExpired ? 'Expired' : 'Active'}
                  </span>
                </p>
              </div>
              <div className="col-md-6">
                <h6 className="text-muted">Supply Information</h6>
                <p><strong>Max Supply:</strong> {event.maxSupply}</p>
                <p><strong>Total Supply:</strong> {event.totalSupply}</p>
                <p><strong>Available:</strong> {event.available}</p>
                <p><strong>Mint Expiration:</strong> 
                  {event.mintExpiration > 0 
                    ? new Date(event.mintExpiration * 1000).toLocaleDateString()
                    : 'No expiration'
                  }
                </p>
              </div>
            </div>
            <hr />
            <div className="row">
              <div className="col-12">
                <h6 className="text-muted">Blockchain Information</h6>
                <p><strong>Transaction Hash:</strong> 
                  <code className="ms-2">{event.txHash}</code>
                </p>
                <p><strong>Block Number:</strong> {event.blockNumber}</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => {
                // Add mint functionality here if needed
                console.log('Mint token for event:', event.eventId);
              }}
              disabled={event.isExpired || event.available <= 0}
            >
              Mint Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
