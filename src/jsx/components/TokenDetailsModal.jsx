import React from 'react';

const TokenDetailsModal = ({ token, isOpen, onClose }) => {
  if (!isOpen || !token) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Token Details</h5>
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
                <h6 className="text-muted">Token Information</h6>
                <p><strong>Token ID:</strong> {token.tokenId}</p>
                <p><strong>Event ID:</strong> {token.eventId}</p>
              </div>
              <div className="col-md-6">
                <h6 className="text-muted">Additional Details</h6>
                <p><strong>Type:</strong> POAP Token</p>
                <p><strong>Status:</strong> 
                  <span className="badge bg-success ms-2">Owned</span>
                </p>
              </div>
            </div>
            <hr />
            <div className="row">
              <div className="col-12">
                <h6 className="text-muted">Blockchain Information</h6>
                <p><strong>Contract Address:</strong> 
                  <code className="ms-2">0xD2f00C7e3Ae394B860d9077B26B9e07d6746D20A</code>
                </p>
                <p><strong>Network:</strong> Polygon Amoy Testnet</p>
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
              className="btn btn-info"
              onClick={() => {
                // Add view on explorer functionality
                const explorerUrl = `https://amoy.polygonscan.com/token/0xD2f00C7e3Ae394B860d9077B26B9e07d6746D20A?a=${token.tokenId}`;
                window.open(explorerUrl, '_blank');
              }}
            >
              View on Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetailsModal;
