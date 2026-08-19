import { getCategoryConfig } from "../constants/eventCategories";

// Shown on event/POAP cards wherever the collapsed-tile action button used to live (see
// eventCard.jsx/poapCard.jsx) — same pill look as those buttons (.btn.btn-white.btn-small) rather
// than a plain Bootstrap .badge, per explicit request, plus a per-category icon (see
// eventCategories.js) ahead of the label. Renders nothing for a category-less (legacy) event/token
// rather than a placeholder.
export default function CategoryBadge({ category, className = "" }) {
  const config = getCategoryConfig(category);
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span className={`btn btn-white btn-small category-badge text-capitalize${className ? ` ${className}` : ""}`}>
      {Icon && <Icon size={13} className="category-badge-icon" aria-hidden="true" />}
      {config.label}
    </span>
  );
}
