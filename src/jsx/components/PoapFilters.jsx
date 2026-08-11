import React from "react";
import { X } from "lucide-react";
import FilterPopover from "./FilterPopover";

// Same client-side filter/sort pattern as EventFilters.jsx, for mySubscriptions.jsx's own POAP
// list. This list comes from private state (see mySubscriptions.jsx's own comment on why), not
// the indexer — only the fields already shaped there (issuerPkHex, isSoulbound, attendedEventIds)
// are filterable, there's no server-side query to extend.
const PoapFilters = ({ filters, onFilterChange, onReset }) => {
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
        <label htmlFor="poap-filter-issuer" className="form-label small text-muted">Issuer contains</label>
        <input
          id="poap-filter-issuer"
          type="text"
          className="form-control form-control-sm"
          placeholder="hex substring…"
          value={filters.issuerSearch || ""}
          onChange={(e) => handleFilterChange("issuerSearch", e.target.value || undefined)}
        />
      </div>

      <div>
        <label htmlFor="poap-filter-type" className="form-label small text-muted">Type</label>
        <select
          id="poap-filter-type"
          className="form-select form-select-sm"
          value={filters.soulbound || ""}
          onChange={(e) => handleFilterChange("soulbound", e.target.value || undefined)}
        >
          <option value="">All Types</option>
          <option value="soulbound">Soulbound</option>
          <option value="transferable">Transferable</option>
        </select>
      </div>

      <div>
        <label htmlFor="poap-filter-sortBy" className="form-label small text-muted">Sort By</label>
        <select
          id="poap-filter-sortBy"
          className="form-select form-select-sm"
          value={filters.sortBy || "tokenId"}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
        >
          <option value="tokenId">Token ID</option>
          <option value="attendanceCount">Events Attended</option>
        </select>
      </div>

      <div>
        <label htmlFor="poap-filter-order" className="form-label small text-muted">Order</label>
        <select
          id="poap-filter-order"
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

export default PoapFilters;
