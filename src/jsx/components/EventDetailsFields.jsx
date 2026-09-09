import { getDetailsFieldsCopy } from "../constants/eventCategories";

// Controlled, single-column: collects { name, description } and hands them back via onChange.
// Split out from image handling (see EventImageField.jsx) so each is independently reusable.
// `category` (optional) swaps the labels/placeholders to match what's actually being created
// (Event/Subscription/Credential) — see eventCategories.js's detailsFields.
export default function EventDetailsFields({ values, onChange, category }) {
  const { name, description } = values;
  const { nameLabel, namePlaceholder, descriptionLabel, descriptionPlaceholder } =
    getDetailsFieldsCopy(category);

  return (
    <>
      <div className="col-12">
        <label className="form-label" htmlFor="eventName">
          {nameLabel} <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          placeholder={namePlaceholder}
          id="eventName"
          name="eventName"
          value={name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          required
        />
      </div>

      <div className="col-12 mb-3">
        <label className="form-label" htmlFor="eventDescription">{descriptionLabel}</label>
        <textarea
          className="form-control"
          placeholder={descriptionPlaceholder}
          id="eventDescription"
          name="eventDescription"
          rows={8}
          style={{ height: "180px", resize: "vertical", paddingTop: "12px" }}
          value={description}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
        />
      </div>
    </>
  );
}
