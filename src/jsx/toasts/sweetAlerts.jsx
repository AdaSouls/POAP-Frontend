import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { CheckCircle2 } from "lucide-react";

const MySwal = withReactContent(Swal);

// Shared across every alert below: centered on the page instead of a corner toast, sized up a
// bit, and styled as the same liquid-glass surface as the wallet-connect popup
// (.drawer.drawer-modal) via the swal2-glass-popup class (see theme-dark-glass.css) — including
// that popup's own "no dimming" choice: backdrop: false, since the glass blur already separates
// the popup from the page without needing to darken everything else too.
const GLASS_ALERT_OPTIONS = {
  position: "center",
  width: "32em",
  showConfirmButton: false,
  timer: 5000,
  timerProgressBar: true,
  backdrop: false,
  customClass: { popup: "swal2-glass-popup" },
};

// Own icon instead of swal2's built-in `icon: "success"`: that one draws its ring/checkmark from
// pieces (.swal2-success-circular-line-left/-right, .swal2-success-fix) hardcoded to mask against
// a solid white popup — never blends cleanly against our translucent glass background no matter
// what color they're pointed at. A plain lucide icon has no such masking trick to get wrong.
const successTitle = (text) => (
  <div className="d-flex flex-column align-items-center" style={{ gap: 10 }}>
    <CheckCircle2 size={48} color="#2ecc71" strokeWidth={1.5} />
    <span>{text}</span>
  </div>
);

export const succesfullBlockchainCreation = (title, message, link) => {
  MySwal.fire({
    ...GLASS_ALERT_OPTIONS,
    title: successTitle(title),
    html: `${message}<br><a href="${link}" target="_blank" style="font-size:0.75em; text-decoration: underline;">See on explorer</a>`,
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};
export const succesfullMessage = (title, message) => {
  MySwal.fire({
    ...GLASS_ALERT_OPTIONS,
    title: successTitle(title),
    text: message,
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};

export const loadingFunction = (title, message) => {
  MySwal.fire({
    ...GLASS_ALERT_OPTIONS,
    title: title,
    icon: "info",
    text: message,
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};
export const informationFunction = (title, message) => {
  MySwal.fire({
    ...GLASS_ALERT_OPTIONS,
    title: title,
    icon: "info",
    text: message,
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};

export const errorFunction = (title, message, link) => {
  MySwal.fire({
    ...GLASS_ALERT_OPTIONS,
    title: title,
    icon: "error",
    text: message,
    heightAuto: true,
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};
