import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const connectedToWalletFunction = (address) => {
  MySwal.fire({
    title: "Connected to wallet",
    icon: "success",
    toast: true,
    text: `Connected to: \n${address}`,
    position: "bottom-right",
    showConfirmButton: false,
    // html: `<a href="${link}" target="_blank" style="font-size:0.75em">See on explorer</a>`,
    timer: 5000,
    timerProgressBar: true,
    heightAuto: true,
    width: "26em",
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
      let text = MySwal.getContainer().querySelector(".swal2-html-container");
      text.style.fontSize = "0.75em";
    },
  })
};

export const succesfullActionFunction = (title, message, link) => {
  MySwal.fire({
    title: title,
    icon: "success",
    toast: true,
    text: message,
    position: "bottom-right",
    showConfirmButton: false,
    html: `<a href="${link}" target="_blank" style="font-size:0.75em">See on explorer</a>`,
    timer: 5000,
    timerProgressBar: true,
    heightAuto: true,
    width: "26em",
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};

export const loadingFunction = (title, message, link) => {
  MySwal.fire({
    title: title,
    icon: "info",
    toast: true,
    text: message,
    position: "bottom-right",
    showConfirmButton: false,
    // html: `<a href="${link}" target="_blank" style="font-size:0.75em">See on explorer</a>`,
    timer: 5000,
    timerProgressBar: true,
    heightAuto: true,
    width: "26em",
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};

export const errorFunction = (title, message, link) => {
  MySwal.fire({
    title: title,
    icon: "error",
    toast: true,
    text: message,
    position: "bottom-right",
    showConfirmButton: false,
    // html: `<a href="${link}" target="_blank" style="font-size:0.75em">See on explorer</a>`,
    timer: 5000,
    timerProgressBar: true,
    heightAuto: true,
    width: "26em",
    didOpen: () => {
      let child = MySwal.getContainer().querySelector(".swal2-title");
      let parent = child.parentElement;
      parent.classList.add("p-2");
    },
  })
};
