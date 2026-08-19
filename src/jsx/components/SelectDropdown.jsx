import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

// Stands in for a native <select> everywhere in the app. Native <option> popups are OS-rendered,
// outside our page's own CSS/glass-surface stack — background-color/color on <option> is the only
// thing reliably stylable there, and even fully solid it still doesn't read as part of the site
// (flat OS list box, no blur/border/radius to match everything else) — see theme-dark-glass.css's
// removed `option` rule history. This renders its own themed panel instead, same
// portal-to-<body> + getBoundingClientRect positioning pattern as FilterPopover.jsx/Tooltip.jsx (a
// nested backdrop-filter inside another backdrop-filter'd ancestor can't sample the real page
// behind it in Chromium, so it has to leave the DOM subtree it was triggered from). Visually it's
// the same small glass-pill family as Tooltip.jsx's .app-tooltip, just interactive (click, not
// hover) and holding a list of options instead of a label.
//
// Controlled like a native <select>: `value` is the current option's value, `onChange` receives
// the newly-picked value directly (not an event — there's no real <select> underneath to read
// event.target.value from). `options` is `{value, label}[]`. `id` lets an external <label
// htmlFor> associate with the trigger button, same as it would with a real <select>; `ariaLabel`
// covers the no-external-label case (e.g. ChannelsField.jsx's per-row selects).
export default function SelectDropdown({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  size,
  className = "",
  style,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((option) => option.value === value);

  const openMenu = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handleReposition = () => setOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const pick = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`form-control select-dropdown-trigger${size === "sm" ? " form-control-sm" : ""}${className ? ` ${className}` : ""}`}
        style={style}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="select-dropdown-value">{selected?.label ?? ""}</span>
        <ChevronDown size={14} className="select-dropdown-chevron" aria-hidden="true" />
      </button>
      {open && pos && createPortal(
        <div
          className="select-dropdown-menu"
          ref={menuRef}
          role="listbox"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
        >
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`select-dropdown-option${option.value === value ? " is-selected" : ""}`}
              onClick={() => pick(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
