// Step 0 of the event-creation wizard: pick what's being created before any other question is
// asked. Controlled — `value` is the selected category key (or null), `onChange` receives the
// newly-picked key. `categories` is an array of category config objects (see
// src/jsx/constants/eventCategories.js's EVENT_CATEGORIES, typically passed as
// Object.values(EVENT_CATEGORIES)) so this component doesn't hardcode which categories exist.
export default function CategoryPicker({ value, onChange, categories }) {
  return (
    <div className="col-12">
      <div className="d-flex flex-column" style={{ gap: "12px" }}>
        {categories.map((category) => {
          const isSelected = value === category.key;
          return (
            <div
              key={category.key}
              role="button"
              tabIndex={0}
              className="drawer-modal-preview-card"
              aria-pressed={isSelected}
              style={{
                cursor: "pointer",
                borderColor: isSelected ? "var(--bs-primary, #6366f1)" : undefined,
                boxShadow: isSelected ? "inset 0 0 0 1px var(--bs-primary, #6366f1)" : undefined,
              }}
              onClick={() => onChange(category.key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(category.key);
                }
              }}
            >
              <div className="d-flex align-items-center" style={{ gap: "14px" }}>
                <div className="form-check mb-0 flex-shrink-0">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="eventCategory"
                    checked={isSelected}
                    readOnly
                    aria-label={category.label}
                  />
                </div>
                <div>
                  <span className="d-block font-weight-semibold">{category.label}</span>
                  <small className="form-text text-muted d-block mt-1">
                    {category.shortDescription}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
