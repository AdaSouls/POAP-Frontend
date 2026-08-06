import React from "react";
import { X } from "lucide-react";
import FilterPopover from "./FilterPopover";

// Filtering is entirely client-side — the Midnight indexer's GET /api/events has no server-side
// filter params (see src/midnight/indexer.service.ts), so events.jsx fetches everything once and
// applies these filters/sort itself. Only fields the on-chain ledger actually has (event id,
// organizer pk, supply, expiration, active flag) are filterable.
// Rendered as the single-column content of a FilterPopover (icon button + portal popover, same
// glass surface as the wallet-connect popup) — this component owns just the fields, not any
// card/expand chrome of its own anymore.
const EventFilters = ({ filters, onFilterChange, onReset }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters || {}).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  return (
    <FilterPopover hasActiveFilters={hasActiveFilters}>
      <div className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Filters &amp; Sort</h6>
        {hasActiveFilters && (
          <button className="btn btn-sm btn-outline-secondary px-2 py-1" onClick={onReset} title="Clear all filters">
            <X size={14} />
          </button>
        )}
      </div>

      <div>
        <label htmlFor="filter-eventId" className="form-label small text-muted">Event ID contains</label>
        <input
          id="filter-eventId"
          type="text"
          className="form-control form-control-sm"
          placeholder="hex substring…"
          value={filters.eventIdSearch || ""}
          onChange={(e) => handleFilterChange("eventIdSearch", e.target.value || undefined)}
        />
      </div>

      <div>
        <label htmlFor="filter-issuer" className="form-label small text-muted">Organizer contains</label>
        <input
          id="filter-issuer"
          type="text"
          className="form-control form-control-sm"
          placeholder="hex substring…"
          value={filters.issuerSearch || ""}
          onChange={(e) => handleFilterChange("issuerSearch", e.target.value || undefined)}
        />
      </div>

      <div>
        <label htmlFor="filter-status" className="form-label small text-muted">Status</label>
        <select
          id="filter-status"
          className="form-select form-select-sm"
          value={filters.status || ""}
          onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="full">Full</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-maxSupplyMin" className="form-label small text-muted">Max Supply (Min)</label>
        <input
          id="filter-maxSupplyMin"
          type="number"
          className="form-control form-control-sm"
          min="0"
          value={filters.maxSupplyMin || ""}
          onChange={(e) => handleFilterChange("maxSupplyMin", e.target.value ? parseInt(e.target.value, 10) : undefined)}
        />
      </div>

      <div>
        <label htmlFor="filter-maxSupplyMax" className="form-label small text-muted">Max Supply (Max)</label>
        <input
          id="filter-maxSupplyMax"
          type="number"
          className="form-control form-control-sm"
          min="0"
          value={filters.maxSupplyMax || ""}
          onChange={(e) => handleFilterChange("maxSupplyMax", e.target.value ? parseInt(e.target.value, 10) : undefined)}
        />
      </div>

      <div>
        <label htmlFor="filter-sortBy" className="form-label small text-muted">Sort By</label>
        <select
          id="filter-sortBy"
          className="form-select form-select-sm"
          value={filters.sortBy || "createdBlock"}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
        >
          <option value="createdBlock">Block Created</option>
          <option value="expiration">Expiration</option>
          <option value="maxSupply">Max Supply</option>
          <option value="minted">Minted</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-order" className="form-label small text-muted">Order</label>
        <select
          id="filter-order"
          className="form-select form-select-sm"
          value={filters.order || "desc"}
          onChange={(e) => handleFilterChange("order", e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </FilterPopover>
  );
};

export default EventFilters;
