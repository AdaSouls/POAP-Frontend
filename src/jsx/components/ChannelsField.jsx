import { Plus, Trash2 } from "lucide-react";
import { CHANNEL_TYPES } from "../constants/eventCategories";
import SelectDropdown from "./SelectDropdown";

// Repeatable list of contact channels ({ type, value }[]) — email, website, telegram, etc. Same
// controlled, full-array-in/full-array-out contract as the rest of the wizard's step components.
// Public by default (see docs/event-creation-wizard-design.md); nothing here decides visibility,
// the caller just includes/omits the whole array from the metadata JSON.
export default function ChannelsField({ values, onChange }) {
  const channels = values || [];

  const updateChannel = (index, patch) => {
    const next = channels.map((channel, i) => (i === index ? { ...channel, ...patch } : channel));
    onChange(next);
  };

  const removeChannel = (index) => {
    onChange(channels.filter((_, i) => i !== index));
  };

  const addChannel = () => {
    onChange([...channels, { type: CHANNEL_TYPES[0].value, value: "" }]);
  };

  return (
    <div className="col-12">
      {channels.map((channel, index) => (
        <div className="d-flex align-items-center mb-2" style={{ gap: "8px" }} key={index}>
          <SelectDropdown
            style={{ maxWidth: "150px", flexShrink: 0 }}
            ariaLabel="Channel type"
            value={channel.type}
            onChange={(newValue) => updateChannel(index, { type: newValue })}
            options={CHANNEL_TYPES}
          />
          <input
            type="text"
            className="form-control"
            placeholder={channel.type === "other" ? "e.g. Signal — @handle" : "e.g. contact@event.com"}
            aria-label="Channel value"
            value={channel.value}
            onChange={(event) => updateChannel(index, { value: event.target.value })}
          />
          <button
            type="button"
            className="btn btn-card-detail-action btn-sm flex-shrink-0"
            onClick={() => removeChannel(index)}
            aria-label="Remove channel"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-card-detail-action btn-sm mt-1" onClick={addChannel}>
        <Plus size={14} className="mr-1" />
        Add channel
      </button>

      <small className="form-text text-muted d-block mt-2">
        Optional. How people can reach you — email, website, social, whatever's relevant.
      </small>
    </div>
  );
}
