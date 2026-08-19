import SelectDropdown from "./SelectDropdown";

// Generic renderer for a category's taxonomy fields (see src/jsx/constants/eventCategories.js) —
// one SelectDropdown per field, all optional. Picking "Other" reveals a free-text input stored
// under `${field}Other`, kept as a sibling key rather than overwriting the enum value so it stays
// clear later whether an answer came from the fixed list or free text. `taxonomy` is the
// category.taxonomy object (field name → {label, options}); `values`/`onChange` follow the same
// controlled, full-object-merge contract as EventDetailsFields/EventImageField.
export default function TaxonomyStepFields({ taxonomy, values, onChange }) {
  const fields = Object.entries(taxonomy || {});

  return (
    <>
      {fields.map(([field, { label, options }]) => {
        const otherField = `${field}Other`;
        const selected = values[field] || "";
        return (
          <div className="col-12 mb-3" key={field}>
            <label className="form-label" htmlFor={field}>
              {label}
            </label>
            <SelectDropdown
              id={field}
              value={selected}
              onChange={(newValue) => onChange({ ...values, [field]: newValue })}
              options={[{ value: "", label: "—" }, ...options]}
            />
            {selected === "other" && (
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Please specify…"
                aria-label={`${label} (other)`}
                value={values[otherField] || ""}
                onChange={(event) => onChange({ ...values, [otherField]: event.target.value })}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
