import React, { useState } from "react";

const EventFilters = ({ filters, onFilterChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onReset();
  };

  const hasActiveFilters = () => {
    return Object.values(localFilters).some(value => 
      value !== undefined && value !== null && value !== ''
    );
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <h5 className="mb-0">
            <i className="icofont-filter me-2"></i>
            Filters & Sort
          </h5>
          <div className="d-flex align-items-center gap-2">
            {hasActiveFilters() && (
              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1"
                onClick={handleReset}
                title="Clear all filters"
              >
                <i className="icofont-close"></i> Clear
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-primary px-2 py-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <i className={`icofont-arrow-${isExpanded ? 'up' : 'down'}`}></i>
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="card-body">
          <div className="row g-3">
            {/* Search by Title */}
            <div className="col-md-6 col-lg-4">
              <label className="form-label small text-muted">
                <i className="icofont-search me-1"></i>
                Search Title
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search events by title..."
                value={localFilters.titleSearch || ''}
                onChange={(e) => handleFilterChange('titleSearch', e.target.value)}
              />
            </div>

            {/* Filter by Status */}
            <div className="col-md-6 col-lg-4">
              <label className="form-label small text-muted">
                <i className="icofont-info-circle me-1"></i>
                Status
              </label>
              <select
                className="form-select form-select-sm"
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            {/* Filter by Expiration */}
            <div className="col-md-6 col-lg-4">
              <label className="form-label small text-muted">
                <i className="icofont-clock-time me-1"></i>
                Expiration
              </label>
              <select
                className="form-select form-select-sm"
                value={localFilters.expired === undefined ? '' : localFilters.expired}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : e.target.value;
                  handleFilterChange('expired', value);
                }}
              >
                <option value="">All Events</option>
                <option value="false">Active (Not Expired)</option>
                <option value="true">Expired</option>
              </select>
            </div>

            {/* Filter by Event ID */}
            <div className="col-md-6 col-lg-4">
              <label className="form-label small text-muted">
                <i className="icofont-id-card me-1"></i>
                Event ID
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Filter by event ID..."
                value={localFilters.eventId || ''}
                onChange={(e) => handleFilterChange('eventId', e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
              />
            </div>

            {/* Sort By */}
            <div className="col-md-6 col-lg-4">
              <label className="form-label small text-muted">
                <i className="icofont-sort me-1"></i>
                Sort By
              </label>
              <select
                className="form-select form-select-sm"
                value={localFilters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="createdAt">Date Created</option>
                <option value="eventStartDate">Event Start Date</option>
                <option value="expiration">Expiration Date</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-md-6 col-lg-4">
              <label className="form-label small text-muted">
                <i className="icofont-arrow-up me-1"></i>
                Order
              </label>
              <select
                className="form-select form-select-sm"
                value={localFilters.order || 'desc'}
                onChange={(e) => handleFilterChange('order', e.target.value)}
              >
                <option value="desc">Descending (Newest First)</option>
                <option value="asc">Ascending (Oldest First)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Badge */}
          {hasActiveFilters() && (
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="small text-muted">Active filters:</span>
                {localFilters.titleSearch && (
                  <span className="badge bg-primary d-flex align-items-center gap-2">
                    Title: "{localFilters.titleSearch}"
                    <button
                      className="btn-close btn-close-white ms-2"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange('titleSearch', undefined)}
                    ></button>
                  </span>
                )}
                {localFilters.status && (
                  <span className="badge bg-info d-flex align-items-center gap-2">
                    Status: {localFilters.status}
                    <button
                      className="btn-close btn-close-white ms-2"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange('status', undefined)}
                    ></button>
                  </span>
                )}
                {localFilters.expired !== undefined && (
                  <span className="badge bg-warning  d-flex align-items-center gap-2">
                    {localFilters.expired === 'true' ? 'Expired' : 'Active'}
                    <button
                      className="btn-close btn-close-white ms-2"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange('expired', undefined)}
                    ></button>
                  </span>
                )}
                {localFilters.eventId !== undefined && (
                  <span className="badge bg-secondary d-flex align-items-center gap-2">
                    Event ID: {localFilters.eventId}
                    <button
                      className="btn-close btn-close-white ms-2"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange('eventId', undefined)}
                    ></button>
                  </span>
                )}
                {localFilters.sortBy && (
                  <span className="badge bg-success">
                    Sort: {localFilters.sortBy} ({localFilters.order || 'desc'})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFilters;

