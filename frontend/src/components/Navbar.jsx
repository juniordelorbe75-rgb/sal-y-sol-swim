import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  useCart,
} from "../CartContext";


const LOGO_URL = "/logo.jpg";


function Navbar() {
  const { cartCount } = useCart();

  const location = useLocation();

  const isHome =
    location.pathname === "/";


  return (
    <header
      className={
        isHome
          ? "navbar home-navbar"
          : "navbar"
      }
    >
      <Link
        to="/"
        className="brand-link"
      >
        <img
          src={LOGO_URL}
          alt="Sal y Sol Swim"
          className="brand-logo"
        />

        <div className="brand-text">
          <span className="brand-main">
            Sal y Sol
          </span>

          <span className="brand-subtitle">
            SWIM
          </span>
        </div>
      </Link>


      <nav>
        <NavLink to="/tienda">
          Tienda
        </NavLink>

        <NavLink to="/contacto">
          Contacto
        </NavLink>

        <NavLink
          to="/carrito"
          className="cart-nav-link"
        >
          Carrito

          <span className="cart-count">
            {cartCount}
          </span>
        </NavLink>
      </nav>
    </header>
  );
}


export default Navbar;