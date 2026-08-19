import React from "react";
import { X } from "lucide-react";
import FilterPopover from "./FilterPopover";
import SelectDropdown from "./SelectDropdown";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "soulbound", label: "Soulbound" },
  { value: "transferable", label: "Transferable" },
];

const SORT_BY_OPTIONS = [
  { value: "tokenId", label: "Token ID" },
  { value: "mintedBlock", label: "Most Recent" },
];

const ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

// Same client-side filter/sort pattern as EventFilters.jsx, for mySubscriptions.jsx's own POAP
// list (see src/midnight/my-tokens.ts for the shape — one entry per token, sourced from the
// indexer).
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
        <SelectDropdown
          id="poap-filter-type"
          size="sm"
          value={filters.soulbound || ""}
          onChange={(value) => handleFilterChange("soulbound", value || undefined)}
          options={TYPE_OPTIONS}
        />
      </div>

      <div>
        <label htmlFor="poap-filter-sortBy" className="form-label small text-muted">Sort By</label>
        <SelectDropdown
          id="poap-filter-sortBy"
          size="sm"
          value={filters.sortBy || "tokenId"}
          onChange={(value) => handleFilterChange("sortBy", value)}
          options={SORT_BY_OPTIONS}
        />
      </div>

      <div>
        <label htmlFor="poap-filter-order" className="form-label small text-muted">Order</label>
        <SelectDropdown
          id="poap-filter-order"
          size="sm"
          value={filters.order || "desc"}
          onChange={(value) => handleFilterChange("order", value)}
          options={ORDER_OPTIONS}
        />
      </div>
    </FilterPopover>
  );
};

export default PoapFilters;
