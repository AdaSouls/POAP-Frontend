import { Children, cloneElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Matches a native title tooltip's own hover delay, not instant.
const SHOW_DELAY_MS = 500;

// Same portal-to-<body> + getBoundingClientRect positioning pattern as FilterPopover.jsx — a
// nested backdrop-filter (this tooltip's glass blur) inside another backdrop-filter'd ancestor
// can't sample the real page behind it in Chromium, so it has to leave the DOM subtree it was
// triggered from. Wraps its single child via cloneElement (not an extra wrapper element) so it
// doesn't disturb the trigger's own flex layout inside .inner-header-row-right etc.
const Tooltip = ({ label, children, placement = "bottom" }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const showTimerRef = useRef(null);

  const show = () => {
    clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const left = rect.left + rect.width / 2;
      setPos(
        placement === "top"
          ? { bottom: window.innerHeight - rect.top + 8, left }
          : { top: rect.bottom + 8, left },
      );
      setOpen(true);
    }, SHOW_DELAY_MS);
  };
  const hide = () => {
    clearTimeout(showTimerRef.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(showTimerRef.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const handleReposition = () => setOpen(false);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const child = Children.only(children);
  const trigger = cloneElement(child, {
    ref: (node) => {
      triggerRef.current = node;
      const { ref } = child;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    onMouseEnter: (e) => {
      child.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e) => {
      child.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e) => {
      child.props.onFocus?.(e);
      show();
    },
    onBlur: (e) => {
      child.props.onBlur?.(e);
      hide();
    },
  });

  return (
    <>
      {trigger}
      {open &&
        pos &&
        createPortal(
          <div className="app-tooltip" style={{ ...pos, transform: "translateX(-50%)" }} role="tooltip">
            {label}
          </div>,
          document.body,
        )}
    </>
  );
};

export default Tooltip;
