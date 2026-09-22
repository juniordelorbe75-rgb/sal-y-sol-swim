import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getProduct,
} from "../api";

import {
  useCart,
} from "../CartContext";

import "./ViewProduct.css";


function formatPrice(price) {
  return new Intl.NumberFormat(
    "es-DO",
    {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }
  ).format(price);
}


function ViewProduct() {
  const { productId } =
    useParams();

  const { addToCart } =
    useCart();

  const [
    product,
    setProduct,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");

  const [
    selectedColor,
    setSelectedColor,
  ] = useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getProduct(
            productId
          );

        if (cancelled) {
          return;
        }

        setProduct(data);

        setSelectedSize(
          data.sizes?.[0] || ""
        );

        setSelectedColor(
          data.colors?.[0] || ""
        );

        setSelectedImage(
          data.image ||
            data.images?.[0] ||
            ""
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err.message ||
            "No pudimos cargar este producto."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);


  const images =
    useMemo(() => {
      if (!product) {
        return [];
      }

      return [
        ...new Set(
          [
            product.image,
            ...(product.images || []),
          ].filter(Boolean)
        ),
      ];
    }, [product]);


  function showNotice(
    message
  ) {
    setNotice(message);

    window.setTimeout(
      () => {
        setNotice("");
      },
      2200
    );
  }


  function handleAddToCart() {
    if (!product) {
      return;
    }

    const result =
      addToCart(
        product,
        selectedSize,
        selectedColor
      );

    showNotice(
      result.message
    );
  }


  if (loading) {
    return (
      <section className="view-product-page">
        <div className="message">
          Cargando producto...
        </div>
      </section>
    );
  }


  if (error || !product) {
    return (
      <section className="view-product-page">
        <div className="view-product-error">
          <h1>
            No encontramos este producto
          </h1>

          <p>
            {error ||
              "Este producto ya no está disponible."}
          </p>

          <Link
            to="/tienda"
            className="collection-button"
          >
            VOLVER A LA TIENDA
          </Link>
        </div>
      </section>
    );
  }


  return (
    <section className="view-product-page">
      {notice && (
        <div className="shop-notification">
          {notice}
        </div>
      )}


      <div className="view-product-back">
        <Link to="/tienda">
          ← Volver a la colección
        </Link>
      </div>


      <div className="view-product-layout">
        <div className="view-product-gallery">
          <div className="view-product-main-image">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
              />
            ) : (
              <div className="view-product-placeholder">
                Sal y Sol
              </div>
            )}

            {product.featured && (
              <span className="featured-badge">
                Destacado
              </span>
            )}
          </div>


          {images.length > 1 && (
            <div className="view-product-thumbnails">
              {images.map(
                (image) => (
                  <button
                    type="button"
                    key={image}
                    className={
                      selectedImage ===
                      image
                        ? "view-thumbnail active"
                        : "view-thumbnail"
                    }
                    onClick={() =>
                      setSelectedImage(
                        image
                      )
                    }
                    aria-label="Ver imagen del producto"
                  >
                    <img
                      src={image}
                      alt={product.name}
                    />
                  </button>
                )
              )}
            </div>
          )}
        </div>


        <div className="view-product-content">
          <p className="section-label">
            SAL Y SOL SWIM
          </p>

          <h1>
            {product.name}
          </h1>

          <strong className="view-product-price">
            {formatPrice(
              product.price
            )}
          </strong>


          {product.description && (
            <p className="view-product-description">
              {product.description}
            </p>
          )}


          <div className="view-stock">
            {product.stock > 0 ? (
              <span className="in-stock">
                Disponible ·{" "}
                {product.stock}{" "}
                {product.stock === 1
                  ? "unidad"
                  : "unidades"}
              </span>
            ) : (
              <span className="out-stock">
                Agotado
              </span>
            )}
          </div>


          {product.sizes?.length >
            0 && (
            <div className="view-product-option">
              <label htmlFor="product-size">
                Talla
              </label>

              <select
                id="product-size"
                value={
                  selectedSize
                }
                onChange={(
                  event
                ) =>
                  setSelectedSize(
                    event.target.value
                  )
                }
              >
                {product.sizes.map(
                  (size) => (
                    <option
                      value={size}
                      key={size}
                    >
                      {size}
                    </option>
                  )
                )}
              </select>
            </div>
          )}


          {product.colors?.length >
            0 && (
            <div className="view-product-option">
              <label htmlFor="product-color">
                Color
              </label>

              <select
                id="product-color"
                value={
                  selectedColor
                }
                onChange={(
                  event
                ) =>
                  setSelectedColor(
                    event.target.value
                  )
                }
              >
                {product.colors.map(
                  (color) => (
                    <option
                      value={color}
                      key={color}
                    >
                      {color}
                    </option>
                  )
                )}
              </select>
            </div>
          )}


          <button
            type="button"
            className="add-button view-product-add"
            disabled={
              product.stock <= 0
            }
            onClick={
              handleAddToCart
            }
          >
            {product.stock > 0
              ? "AGREGAR AL CARRITO"
              : "AGOTADO"}
          </button>


          <Link
            to="/carrito"
            className="view-cart-link"
          >
            Ver carrito
          </Link>
        </div>
      </div>
    </section>
  );
}


export default ViewProduct;