// Controlled, single-column: collects { name, description } and hands them back via onChange.
// Split out from image handling (see EventImageField.jsx) so each is independently reusable.
export default function EventDetailsFields({ values, onChange }) {
  const { name, description } = values;

  return (
    <>
      <div className="col-12">
        <label className="form-label" htmlFor="eventName">
          Event Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. AdaSouls Meetup 2026"
          id="eventName"
          name="eventName"
          value={name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          required
        />
      </div>

      <div className="col-12 mb-3">
        <label className="form-label" htmlFor="eventDescription">Description</label>
        <textarea
          className="form-control"
          placeholder="What's this event about?"
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
