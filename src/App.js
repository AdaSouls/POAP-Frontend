import "react-perfect-scrollbar/dist/css/styles.css";
import "../src/css/style.css";
import "./App.css";
import Router from "./jsx/router";
import { DrawerProvider } from "./jsx/contexts/drawer/drawer.provider";
import { Drawer } from "./jsx/drawer/drawer";

function App() {
  return (
    <>
      <DrawerProvider>
        <Router />
      </DrawerProvider>
    </>
  );
}

export default App;
