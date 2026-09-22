import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Store from "./pages/Store";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";
import ViewProduct from "./pages/ViewProduct";


function App() {
  return (
    <div className="app">
      <Navbar />

      <main>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/tienda"
            element={<Store />}
          />

          <Route
            path="/producto/:productId"
            element={<ViewProduct />}
          />

          <Route
            path="/carrito"
            element={<Cart />}
          />

          <Route
            path="/contacto"
            element={<Contact />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </main>


      <footer>
        <div>
          <strong>
            Sal y Sol Swim
          </strong>

          <p>
            República Dominicana
          </p>
        </div>

        <p>
          ©{" "}
          {new Date().getFullYear()}{" "}
          Sal y Sol Swim
        </p>
      </footer>
    </div>
  );
}


export default App;