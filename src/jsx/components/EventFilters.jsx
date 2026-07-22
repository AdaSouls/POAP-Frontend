import React, { useState, useEffect } from "react";

// Filtering is entirely client-side now — the Midnight indexer's GET /api/events has no
// server-side filter params (see src/midnight/indexer.service.ts), so events.jsx fetches
// everything once and applies these filters/sort itself. Only fields the on-chain ledger
// actually has (event id, organizer pk, supply, expiration, active flag) are filterable.
const EventFilters = ({ filters, onFilterChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onFilterChange({});
    onReset();
  };

  const hasActiveFilters = () =>
    Object.values(localFilters).some((value) => value !== undefined && value !== null && value !== "");

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
              <button className="btn btn-sm btn-outline-secondary px-2 py-1" onClick={handleReset} title="Clear all filters">
                <i className="icofont-close"></i> Clear
              </button>
            )}
            <button className="btn btn-sm btn-outline-primary px-2 py-1" onClick={() => setIsExpanded(!isExpanded)}>
              <i className={`icofont-arrow-${isExpanded ? "up" : "down"}`}></i>
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6 col-lg-4">
              <label htmlFor="filter-eventId" className="form-label small text-muted">Event ID contains</label>
              <input
                id="filter-eventId"
                type="text"
                className="form-control form-control-sm"
                placeholder="hex substring…"
                value={localFilters.eventIdSearch || ""}
                onChange={(e) => handleFilterChange("eventIdSearch", e.target.value || undefined)}
              />
            </div>

            <div className="col-md-6 col-lg-4">
              <label htmlFor="filter-issuer" className="form-label small text-muted">Organizer contains</label>
              <input
                id="filter-issuer"
                type="text"
                className="form-control form-control-sm"
                placeholder="hex substring…"
                value={localFilters.issuerSearch || ""}
                onChange={(e) => handleFilterChange("issuerSearch", e.target.value || undefined)}
              />
            </div>

            <div className="col-md-6 col-lg-4">
              <label htmlFor="filter-status" className="form-label small text-muted">Status</label>
              <select
                id="filter-status"
                className="form-select form-select-sm"
                value={localFilters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="full">Full</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label htmlFor="filter-maxSupplyMin" className="form-label small text-muted">Max Supply (Min)</label>
              <input
                id="filter-maxSupplyMin"
                type="number"
                className="form-control form-control-sm"
                min="0"
                value={localFilters.maxSupplyMin || ""}
                onChange={(e) => handleFilterChange("maxSupplyMin", e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label htmlFor="filter-maxSupplyMax" className="form-label small text-muted">Max Supply (Max)</label>
              <input
                id="filter-maxSupplyMax"
                type="number"
                className="form-control form-control-sm"
                min="0"
                value={localFilters.maxSupplyMax || ""}
                onChange={(e) => handleFilterChange("maxSupplyMax", e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label htmlFor="filter-sortBy" className="form-label small text-muted">Sort By</label>
              <select
                id="filter-sortBy"
                className="form-select form-select-sm"
                value={localFilters.sortBy || "createdBlock"}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="createdBlock">Block Created</option>
                <option value="expiration">Expiration</option>
                <option value="maxSupply">Max Supply</option>
                <option value="minted">Minted</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label htmlFor="filter-order" className="form-label small text-muted">Order</label>
              <select
                id="filter-order"
                className="form-select form-select-sm"
                value={localFilters.order || "desc"}
                onChange={(e) => handleFilterChange("order", e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventFilters;
