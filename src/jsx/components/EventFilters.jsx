import React, { useState, useEffect } from "react";

const EventFilters = ({ filters, onFilterChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

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

  // Helper to convert date input (YYYY-MM-DD) to Unix timestamp (seconds)
  const dateToTimestamp = (dateString) => {
    if (!dateString) return undefined;
    return Math.floor(new Date(dateString).getTime() / 1000);
  };

  // Helper to convert Unix timestamp (seconds) to date input format (YYYY-MM-DD)
  const timestampToDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
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
          {/* Search Section */}
          <div className="mb-4">
            <h6 className="text-muted mb-3">
              <i className="icofont-search me-2"></i>
              Search
            </h6>
            <div className="row g-3">
              <div className="col-md-6 col-lg-4">
                <label className="form-label small text-muted">
                  <i className="icofont-file-text me-1"></i>
                  Search Title
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search events by title..."
                  value={localFilters.titleSearch || ''}
                  onChange={(e) => handleFilterChange('titleSearch', e.target.value || undefined)}
                />
              </div>

              <div className="col-md-6 col-lg-4">
                <label className="form-label small text-muted">
                  <i className="icofont-id-card me-1"></i>
                  Search Event ID
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search by event ID..."
                  value={localFilters.eventIdSearch || ''}
                  onChange={(e) => handleFilterChange('eventIdSearch', e.target.value || undefined)}
                />
              </div>

              <div className="col-md-6 col-lg-4">
                <label className="form-label small text-muted">
                  <i className="icofont-info-circle me-1"></i>
                  Status
                </label>
                <select
                  className="form-select form-select-sm"
                  value={localFilters.calculatedStatus || ''}
                  onChange={(e) => handleFilterChange('calculatedStatus', e.target.value || undefined)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Range Section */}
          <div className="mb-4">
            <h6 className="text-muted mb-3">
              <i className="icofont-calendar me-2"></i>
              Date Filters
            </h6>
            <div className="row g-3">
              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-calendar me-1"></i>
                  Event Start Date (From)
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={timestampToDate(localFilters.eventStartDateMin)}
                  onChange={(e) => handleFilterChange('eventStartDateMin', dateToTimestamp(e.target.value))}
                />
              </div>

              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-calendar me-1"></i>
                  Event Start Date (To)
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={timestampToDate(localFilters.eventStartDateMax)}
                  onChange={(e) => handleFilterChange('eventStartDateMax', dateToTimestamp(e.target.value))}
                />
              </div>

              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-clock-time me-1"></i>
                  Expiration Date (From)
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={timestampToDate(localFilters.expirationMin)}
                  onChange={(e) => handleFilterChange('expirationMin', dateToTimestamp(e.target.value))}
                />
              </div>

              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-clock-time me-1"></i>
                  Expiration Date (To)
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={timestampToDate(localFilters.expirationMax)}
                  onChange={(e) => handleFilterChange('expirationMax', dateToTimestamp(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Supply Range Section */}
          <div className="mb-4">
            <h6 className="text-muted mb-3">
              <i className="icofont-cubes me-2"></i>
              Supply Filters
            </h6>
            <div className="row g-3">
              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-cube me-1"></i>
                  Max Supply (Min)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min max supply..."
                  value={localFilters.maxSupplyMin || ''}
                  onChange={(e) => handleFilterChange('maxSupplyMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  min="0"
                />
              </div>

              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-cube me-1"></i>
                  Max Supply (Max)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max max supply..."
                  value={localFilters.maxSupplyMax || ''}
                  onChange={(e) => handleFilterChange('maxSupplyMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  min="0"
                />
              </div>

              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-cube me-1"></i>
                  Total Supply (Min)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min total supply..."
                  value={localFilters.totalSupplyMin || ''}
                  onChange={(e) => handleFilterChange('totalSupplyMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  min="0"
                />
              </div>

              <div className="col-md-6 col-lg-3">
                <label className="form-label small text-muted">
                  <i className="icofont-cube me-1"></i>
                  Total Supply (Max)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max total supply..."
                  value={localFilters.totalSupplyMax || ''}
                  onChange={(e) => handleFilterChange('totalSupplyMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Sort Section */}
          <div className="mb-3">
            <h6 className="text-muted mb-3">
              <i className="icofont-sort me-2"></i>
              Sort Options
            </h6>
            <div className="row g-3">
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
                  <option value="maxSupply">Max Supply</option>
                  <option value="totalSupply">Total Supply</option>
                </select>
              </div>

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
          </div>

          {/* Active Filters Badge */}
          {hasActiveFilters() && (
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="small text-muted fw-bold">Active filters:</span>
                {localFilters.titleSearch && (
                  <span className="badge bg-primary d-flex align-items-center gap-2">
                    Title: "{localFilters.titleSearch}"
                    <button
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange('titleSearch', undefined)}
                    ></button>
                  </span>
                )}
                {localFilters.eventIdSearch && (
                  <span className="badge bg-secondary d-flex align-items-center gap-2">
                    Event ID: "{localFilters.eventIdSearch}"
                    <button
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange('eventIdSearch', undefined)}
                    ></button>
                  </span>
                )}
                {localFilters.calculatedStatus && (
                  <span className="badge bg-info d-flex align-items-center gap-2">
                    Status: {localFilters.calculatedStatus}
                    <button
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange('calculatedStatus', undefined)}
                    ></button>
                  </span>
                )}
                {(localFilters.eventStartDateMin || localFilters.eventStartDateMax) && (
                  <span className="badge bg-success d-flex align-items-center gap-2">
                    Start: {timestampToDate(localFilters.eventStartDateMin) || '...'} - {timestampToDate(localFilters.eventStartDateMax) || '...'}
                    <button
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => {
                        handleFilterChange('eventStartDateMin', undefined);
                        handleFilterChange('eventStartDateMax', undefined);
                      }}
                    ></button>
                  </span>
                )}
                {(localFilters.expirationMin || localFilters.expirationMax) && (
                  <span className="badge bg-warning d-flex align-items-center gap-2">
                    Expiration: {timestampToDate(localFilters.expirationMin) || '...'} - {timestampToDate(localFilters.expirationMax) || '...'}
                    <button
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => {
                        handleFilterChange('expirationMin', undefined);
                        handleFilterChange('expirationMax', undefined);
                      }}
                    ></button>
                  </span>
                )}
                {(localFilters.maxSupplyMin || localFilters.maxSupplyMax) && (
                  <span className="badge bg-danger d-flex align-items-center gap-2">
                    Max Supply: {localFilters.maxSupplyMin || '...'} - {localFilters.maxSupplyMax || '...'}
                    <button
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => {
                        handleFilterChange('maxSupplyMin', undefined);
                        handleFilterChange('maxSupplyMax', undefined);
                      }}
                    ></button>
                  </span>
                )}
                {(localFilters.totalSupplyMin || localFilters.totalSupplyMax) && (
                  <span className="badge bg-dark d-flex align-items-center gap-2">
                    Total Supply: {localFilters.totalSupplyMin || '...'} - {localFilters.totalSupplyMax || '...'}
                    <button
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => {
                        handleFilterChange('totalSupplyMin', undefined);
                        handleFilterChange('totalSupplyMax', undefined);
                      }}
                    ></button>
                  </span>
                )}
                {localFilters.sortBy && (
                  <span className="badge bg-light text-dark">
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
