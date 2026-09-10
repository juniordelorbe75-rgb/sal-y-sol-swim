import { Link } from "react-router-dom";

import { useCart } from "../CartContext";
import { WHATSAPP_NUMBER } from "../config";


function formatPrice(price) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(price);
}


function Cart() {
  const {
    cart,
    cartCount,
    cartTotal,
    increase,
    decrease,
    removeItem,
    clearCart,
  } = useCart();

  const orderText = [
    "¡Hola! Quiero ordenar:",
    ...cart.map(
      ({ product, size, color, quantity }) =>
        `• ${product.name} x${quantity}${size ? ` | Talla: ${size}` : ""}${color ? ` | Color: ${color}` : ""}`
    ),
    `Total: ${formatPrice(cartTotal)}`,
  ].join("\n");

  const whatsappUrl = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`
    : "";


  return (
    <section className="cart-page">
      <div className="store-header cart-header">
        <p className="section-label">TU SELECCIÓN</p>

        <h1>Carrito bajo el sol</h1>

        <p>
          Revisa tus favoritos y completa tu pedido directamente por WhatsApp.
        </p>
      </div>


      {cart.length === 0 ? (
        <div className="empty-cart">
          <span className="empty-cart-symbol">☀</span>
          <h2>Tu carrito espera su primer favorito</h2>
          <p>Explora la colección y elige el traje de baño perfecto para ti.</p>
          <Link to="/tienda" className="collection-button">
            VER LA COLECCIÓN
          </Link>
        </div>
      ) : (
        <div className="cart-page-layout">
          <div className="cart-products">
            {cart.map(({ cartKey, product, size, color, quantity }) => (
              <article className="cart-page-item" key={cartKey}>
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="cart-image-placeholder">Sal y Sol</div>
                )}

                <div className="cart-page-info">
                  <h3>{product.name}</h3>
                  <p>
                    {[size && `Talla ${size}`, color].filter(Boolean).join(" · ")}
                  </p>
                  <strong>{formatPrice(product.price * quantity)}</strong>
                </div>

                <div className="quantity-controls" aria-label={`Cantidad de ${product.name}`}>
                  <button type="button" onClick={() => decrease(cartKey)} aria-label="Reducir cantidad">
                    −
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => increase(cartKey)}
                    disabled={quantity >= product.stock}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <button type="button" className="remove-button" onClick={() => removeItem(cartKey)}>
                  Quitar
                </button>
              </article>
            ))}
          </div>

          <aside className="checkout-card">
            <p className="checkout-label">RESUMEN DEL PEDIDO</p>
            <h2>{cartCount} {cartCount === 1 ? "pieza" : "piezas"}</h2>

            <div className="checkout-total">
              <span>Total</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <p className="checkout-note">
              La disponibilidad, entrega y forma de pago se confirman personalmente contigo.
            </p>

            {whatsappUrl ? (
              <a className="whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer">
                ORDENAR POR WHATSAPP
              </a>
            ) : (
              <button type="button" className="whatsapp-button" disabled>
                WHATSAPP PRÓXIMAMENTE
              </button>
            )}

            <Link to="/tienda" className="continue-shopping-link">
              Seguir comprando
            </Link>

            <button type="button" className="clear-cart-button" onClick={clearCart}>
              Vaciar carrito
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}


export default Cart;
