import { Plus, Trash2 } from "lucide-react";

// Repeatable list of private-attribute rows ({ fieldName, value }[]) — same controlled,
// full-array-in/full-array-out contract as ChannelsField.jsx. Empty list is valid (no private
// attributes committed). Values are capped at 32 UTF-8 bytes — see
// src/midnight/attribute-value-codec.ts, the encoding every committed value and every disclosure
// request's candidate set must agree on byte-for-byte.
const MAX_VALUE_BYTES = 32;

function utf8ByteLength(value) {
  return new TextEncoder().encode(value).length;
}

// labelsOnly (Credential events): rows are just field names — the values are filled in per
// recipient when the credential is issued (mintPoap.jsx), so there's no value input here.
export default function PrivateAttributesStepFields({ values, onChange, labelsOnly = false }) {
  const attributes = values || [];

  const updateAttribute = (index, patch) => {
    const next = attributes.map((attribute, i) => (i === index ? { ...attribute, ...patch } : attribute));
    onChange(next);
  };

  const removeAttribute = (index) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const addAttribute = () => {
    onChange([...attributes, { fieldName: "", value: "" }]);
  };

  return (
    <div className="col-12">
      {attributes.map((attribute, index) => {
        const byteLength = utf8ByteLength(attribute.value || "");
        const overLimit = byteLength > MAX_VALUE_BYTES;
        return (
          <div className="mb-3" key={index}>
            <div className="d-flex align-items-center mb-2" style={{ gap: "8px" }}>
              <input
                type="text"
                className="form-control"
                placeholder={labelsOnly ? "Field name (e.g. Seat)" : "Label (e.g. Region)"}
                aria-label="Attribute label"
                style={labelsOnly ? undefined : { maxWidth: "150px", flexShrink: 0 }}
                value={attribute.fieldName}
                onChange={(event) => updateAttribute(index, { fieldName: event.target.value })}
              />
              {!labelsOnly && (
              <input
                type="text"
                className={`form-control${overLimit ? " is-invalid" : ""}`}
                placeholder="Value (e.g. EU)"
                aria-label="Attribute value"
                value={attribute.value}
                onChange={(event) => updateAttribute(index, { value: event.target.value })}
              />
              )}
              <button
                type="button"
                className="btn btn-card-detail-action btn-sm flex-shrink-0"
                onClick={() => removeAttribute(index)}
                aria-label="Remove attribute"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {!labelsOnly && overLimit && (
              <small className="form-text text-danger d-block">
                {byteLength}/{MAX_VALUE_BYTES} bytes — too long, shorten this value.
              </small>
            )}
          </div>
        );
      })}

      <button type="button" className="btn btn-card-detail-action btn-sm mt-1" onClick={addAttribute}>
        <Plus size={14} className="mr-1" />
        {labelsOnly ? "Add private field" : "Add private attribute"}
      </button>

      {labelsOnly ? (
        <small className="form-text text-muted d-block mt-2">
          Optional. Private details each credential carries (e.g. Seat, Sector, Holder name). You'll
          fill in the values for each person when you issue their credential; only they receive
          them, and they can prove one to someone without revealing it.
        </small>
      ) : (
        <small className="form-text text-muted d-block mt-2">
          Optional. Short facts about this event you can later prove to someone (e.g. "Region: EU")
          without revealing the value itself — see selective disclosure. Values are capped at{" "}
          {MAX_VALUE_BYTES} bytes.
        </small>
      )}
    </div>
  );
}
