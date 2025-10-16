import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { DrawerProvider } from "./jsx/contexts/drawer/drawer.provider";
import { UserRolesProvider } from "./jsx/contexts/user-roles/user-roles.provider";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DrawerProvider>
      <UserRolesProvider>
        <App />
      </UserRolesProvider>
    </DrawerProvider>  
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
