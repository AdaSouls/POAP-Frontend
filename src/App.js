import "react-perfect-scrollbar/dist/css/styles.css";
import "../src/css/style.css";
import "./css/theme-dark-glass.css";
import "./App.css";
import Router from "./jsx/router";
import TxStatusPopup from "./jsx/components/TxStatusPopup";

function App() {
  return (
    <>
       <Router />
       <TxStatusPopup />
    </>
  );
}

export default App;
