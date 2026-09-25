import { Plus, Trash2 } from "lucide-react";
import { canonicalValue, FIELD_TYPES } from "../../midnight/attribute-types";

const TYPE_LABELS = { text: "Text", number: "Number", date: "Date", list: "List" };

// A list field's options are typed comma-separated; each must be a valid 32-byte text value.
export const splitOptions = (text) =>
  (text || "")
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);

// Why this row can't be saved, or null. Empty rows are fine (ignored at submit).
export function privateFieldRowError(row) {
  if (!row.fieldName.trim()) return null;
  if (row.type === "number") {
    const min = row.min === "" || row.min === undefined ? undefined : Number(row.min);
    const max = row.max === "" || row.max === undefined ? undefined : Number(row.max);
    if ((min !== undefined && !Number.isSafeInteger(min)) || (max !== undefined && !Number.isSafeInteger(max))) {
      return "Min and max must be whole numbers.";
    }
    if (min !== undefined && max !== undefined && min > max) return "Min is above max.";
  }
  if (row.type === "list") {
    const options = splitOptions(row.optionsText);
    if (options.length < 2) return "Add at least two options, separated by commas.";
    if (new Set(options).size !== options.length) return "Each option must appear once.";
    const tooLong = options.find((option) => "error" in canonicalValue({ type: "text" }, option));
    if (tooLong) return `"${tooLong}" is longer than 32 bytes.`;
  }
  return null;
}

// The public template entry for a row (createEvent.jsx → metadata.credentialAttributeFields).
export function privateFieldFromRow(row, fieldId) {
  const field = { fieldId, label: row.fieldName.trim(), type: row.type || "text" };
  if (field.type === "number") {
    if (row.min !== "" && row.min !== undefined) field.min = Number(row.min);
    if (row.max !== "" && row.max !== undefined) field.max = Number(row.max);
  }
  if (field.type === "list") field.options = splitOptions(row.optionsText);
  return field;
}

// Repeatable list of a Credential event's private fields ({ fieldName, type, min, max, optionsText }[])
// — same controlled, full-array-in/full-array-out contract as ChannelsField.jsx. Empty list is valid
// (no private fields). The values are filled in per recipient when the credential is issued
// (mintPoap.jsx); the type decides the input there and the questions that can be asked about it
// (QuestionBuilder.jsx): numbers and dates allow ranges, like "age ≥ 18".
export default function PrivateAttributesStepFields({ values, onChange }) {
  const attributes = values || [];

  const updateAttribute = (index, patch) => {
    const next = attributes.map((attribute, i) => (i === index ? { ...attribute, ...patch } : attribute));
    onChange(next);
  };

  const removeAttribute = (index) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const addAttribute = () => {
    onChange([...attributes, { fieldName: "", type: "text", min: "", max: "", optionsText: "" }]);
  };

  return (
    <div className="col-12">
      {attributes.map((attribute, index) => {
        const type = attribute.type || "text";
        const error = privateFieldRowError({ ...attribute, type });
        return (
          <div className="mb-3" key={index}>
            <div className="d-flex align-items-center mb-2" style={{ gap: "8px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Field name (e.g. Seat)"
                aria-label="Attribute label"
                value={attribute.fieldName}
                onChange={(event) => updateAttribute(index, { fieldName: event.target.value })}
              />
              <select
                className="form-control"
                aria-label="Field type"
                style={{ maxWidth: "120px", flexShrink: 0 }}
                value={type}
                onChange={(event) => updateAttribute(index, { type: event.target.value })}
              >
                {FIELD_TYPES.map((option) => (
                  <option key={option} value={option}>{TYPE_LABELS[option]}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-card-detail-action btn-sm flex-shrink-0"
                onClick={() => removeAttribute(index)}
                aria-label="Remove attribute"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {type === "number" && (
              <div className="d-flex mb-2" style={{ gap: "8px" }}>
                <input
                  type="number"
                  step={1}
                  className="form-control"
                  placeholder="Min (optional)"
                  aria-label="Minimum value"
                  value={attribute.min ?? ""}
                  onChange={(event) => updateAttribute(index, { min: event.target.value })}
                />
                <input
                  type="number"
                  step={1}
                  className="form-control"
                  placeholder="Max (optional)"
                  aria-label="Maximum value"
                  value={attribute.max ?? ""}
                  onChange={(event) => updateAttribute(index, { max: event.target.value })}
                />
              </div>
            )}
            {type === "list" && (
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Options, separated by commas (e.g. Campo, Platea, VIP)"
                aria-label="List options"
                value={attribute.optionsText ?? ""}
                onChange={(event) => updateAttribute(index, { optionsText: event.target.value })}
              />
            )}
            {error && <small className="form-text text-danger d-block">{error}</small>}
          </div>
        );
      })}

      <button type="button" className="btn btn-card-detail-action btn-sm mt-1" onClick={addAttribute}>
        <Plus size={14} className="mr-1" />
        Add private field
      </button>

      <small className="form-text text-muted d-block mt-2">
        Optional. Private details each credential carries (e.g. Seat, Sector, Birth date). You'll
        fill in the values for each person when you issue their credential; only they receive
        them, and they can prove one to someone without revealing it. Numbers are whole numbers;
        numbers and dates can be asked about as ranges (e.g. "at least 18").
      </small>
    </div>
  );
}
