// Organizer identity shown on event/POAP cards in place of the raw public key — a display name
// (person or company), always collected regardless of organizer type, plus an optional
// address/location block. Distinct from any per-event private venue address (see
// docs/event-creation-wizard-design.md's "Organization profile" section). `showAddress` gates only
// the address sub-fields (see createEvent.jsx's isOrganizationProfileApplicable — still skipped for
// an individual/independent organizer), never the name field, since a display name is just as
// useful for a person as for a company. The caller decides whether to include the `organization`
// key in the metadata JSON at all (only when name or at least one address field is filled). Same
// controlled, full-object-merge contract as EventDetailsFields.
//
// City/State and Country/Postal code are paired into 2-column rows (name and address stay
// full-width — both can run long) so this step doesn't read as one long vertical list of fields.
export default function OrganizationProfileFields({ values, onChange, showAddress = true }) {
  const field = (key, label, colClassName = "col-12", extraProps = {}) => (
    <div className={`${colClassName} mb-3`} key={key}>
      <label className="form-label" htmlFor={key}>
        {label}
      </label>
      <input
        type="text"
        className="form-control"
        id={key}
        name={key}
        value={values?.[key] || ""}
        onChange={(event) => onChange({ ...values, [key]: event.target.value })}
        {...extraProps}
      />
    </div>
  );

  return (
    <>
      {field("name", "Organizer Name", "col-12", { placeholder: "Your name, or your organization's name" })}
      {showAddress && (
        <>
          {field("addressLine", "Address")}
          {field("locality", "City", "col-6")}
          {field("region", "State / Province", "col-6")}
          {field("country", "Country", "col-6")}
          {field("postalCode", "Postal code", "col-6")}
        </>
      )}
      <div className="col-12">
        <small className="form-text text-muted">
          Optional. The name is shown on your event/credential cards instead of your raw public
          key — leave anything blank you'd rather not share.
        </small>
      </div>
    </>
  );
}
