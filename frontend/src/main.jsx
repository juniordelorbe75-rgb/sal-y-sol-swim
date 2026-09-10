import React from "react";

import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App.jsx";

import Admin from "./Admin.jsx";

import {
  CartProvider,
} from "./CartContext.jsx";

import "./styles.css";


const path =
  window.location.pathname
    .toLowerCase()
    .replace(/\/+$/, "");


const isAdminPage =
  path === "/admin";


ReactDOM.createRoot(
  document.getElementById(
    "root"
  )
).render(
  <React.StrictMode>
    {isAdminPage ? (
      <Admin />
    ) : (
      <BrowserRouter>
        <CartProvider>
          <App />
        </CartProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>
);


if (
  "serviceWorker" in navigator &&
  import.meta.env.PROD
) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker.register(
        "/sw.js"
      );
    }
  );
}
