import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getProducts,
} from "../api";

import {
  useCart,
} from "../CartContext";


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


function Store() {
  const navigate = useNavigate();

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");

  const [
    selectedColor,
    setSelectedColor,
  ] = useState("");

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [
    availability,
    setAvailability,
  ] = useState("");

  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState({});

  const [notice, setNotice] =
    useState("");


  const { addToCart } = useCart();


  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getProducts();

        setProducts(data);

        const options = {};

        data.forEach((product) => {
          options[product.id] = {
            size:
              product.sizes?.[0] ||
              "",
            color:
              product.colors?.[0] ||
              "",
          };
        });

        setSelectedOptions(
          options
        );
      } catch (err) {
        setError(
          err.message ||
            "No pudimos cargar los productos."
        );
      } finally {
        setLoading(false);
      }
    }


    loadProducts();
  }, []);


  const sizes =
    useMemo(() => {
      return [
        ...new Set(
          products.flatMap(
            (product) =>
              product.sizes || []
          )
        ),
      ].sort();
    }, [products]);


  const colors =
    useMemo(() => {
      return [
        ...new Set(
          products.flatMap(
            (product) =>
              product.colors || []
          )
        ),
      ].sort();
    }, [products]);


  const filteredProducts =
    useMemo(() => {
      return products.filter(
        (product) => {
          if (
            selectedSize &&
            !(
              product.sizes || []
            ).includes(
              selectedSize
            )
          ) {
            return false;
          }


          if (
            selectedColor &&
            !(
              product.colors || []
            ).includes(
              selectedColor
            )
          ) {
            return false;
          }


          if (
            minPrice &&
            product.price <
              Number(minPrice)
          ) {
            return false;
          }


          if (
            maxPrice &&
            product.price >
              Number(maxPrice)
          ) {
            return false;
          }


          if (
            availability ===
              "available" &&
            product.stock <= 0
          ) {
            return false;
          }


          if (
            availability ===
              "soldout" &&
            product.stock > 0
          ) {
            return false;
          }


          return true;
        }
      );
    }, [
      products,
      selectedSize,
      selectedColor,
      minPrice,
      maxPrice,
      availability,
    ]);


  function changeOption(
    productId,
    field,
    value
  ) {
    setSelectedOptions(
      (current) => ({
        ...current,

        [productId]: {
          ...current[
            productId
          ],

          [field]: value,
        },
      })
    );
  }


  function showNotice(message) {
    setNotice(message);

    window.setTimeout(
      () => setNotice(""),
      2200
    );
  }


  function handleAdd(product) {
    const options =
      selectedOptions[
        product.id
      ] || {};


    const result =
      addToCart(
        product,
        options.size,
        options.color
      );


    showNotice(
      result.message
    );
  }


  function clearFilters() {
    setSelectedSize("");
    setSelectedColor("");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("");
  }


  function openProduct(productId) {
    navigate(
      `/producto/${productId}`
    );
  }


  return (
    <section className="store-page">
      {notice && (
        <div className="shop-notification">
          {notice}
        </div>
      )}


      <div className="store-header">
        <p className="section-label">
          TIENDA
        </p>

        <h1>
          Explora nuestra colección
        </h1>

        <p>
          Encuentra el bikini ideal
          por talla, color, precio o
          disponibilidad.
        </p>
      </div>


      <div className="store-layout">
        <aside className="filters-panel">
          <div className="filters-title">
            <h3>
              Filtrar
            </h3>

            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Limpiar
            </button>
          </div>


          <label>
            Precio mínimo

            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(
                event
              ) =>
                setMinPrice(
                  event.target.value
                )
              }
              placeholder="RD$"
            />
          </label>


          <label>
            Precio máximo

            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(
                event
              ) =>
                setMaxPrice(
                  event.target.value
                )
              }
              placeholder="RD$"
            />
          </label>


          <label>
            Talla

            <select
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
              <option value="">
                Todas
              </option>

              {sizes.map(
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
          </label>


          <label>
            Color

            <select
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
              <option value="">
                Todos
              </option>

              {colors.map(
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
          </label>


          <label>
            Disponibilidad

            <select
              value={
                availability
              }
              onChange={(
                event
              ) =>
                setAvailability(
                  event.target.value
                )
              }
            >
              <option value="">
                Todos
              </option>

              <option value="available">
                Disponible
              </option>

              <option value="soldout">
                Agotado
              </option>
            </select>
          </label>
        </aside>


        <div className="store-results">
          <div className="results-count">
            {
              filteredProducts.length
            }{" "}
            producto
            {filteredProducts.length !==
            1
              ? "s"
              : ""}
          </div>


          {loading && (
            <div className="message">
              Cargando colección...
            </div>
          )}


          {!loading && error && (
            <div className="message">
              {error}
            </div>
          )}


          {!loading &&
            !error &&
            filteredProducts.length ===
              0 && (
              <div className="message">
                No encontramos
                productos con esos
                filtros.
              </div>
            )}


          {!loading &&
            !error &&
            filteredProducts.length >
              0 && (
              <div className="products-grid">
                {filteredProducts.map(
                  (product) => {
                    const options =
                      selectedOptions[
                        product.id
                      ] || {};


                    return (
                      <article
                        className="product-card product-card-clickable"
                        key={
                          product.id
                        }
                        onClick={() =>
                          openProduct(
                            product.id
                          )
                        }
                      >
                        <Link
                          to={`/producto/${product.id}`}
                          className="product-card-link"
                          aria-label={`Ver ${product.name}`}
                        >
                          <div className="product-image">
                            {product.image ? (
                              <img
                                src={
                                  product.image
                                }
                                alt={
                                  product.name
                                }
                              />
                            ) : (
                              <div className="image-placeholder">
                                Sal y Sol
                              </div>
                            )}


                            {product.featured && (
                              <span className="featured-badge">
                                Destacado
                              </span>
                            )}
                          </div>
                        </Link>


                        <div className="product-content">
                          <Link
                            to={`/producto/${product.id}`}
                            className="product-title-link"
                            aria-label={`Ver detalles de ${product.name}`}
                          >
                            <div className="product-title-row">
                              <h3>
                                {
                                  product.name
                                }
                              </h3>

                              <strong>
                                {formatPrice(
                                  product.price
                                )}
                              </strong>
                            </div>
                          </Link>


                          {product.sizes
                            ?.length >
                            0 && (
                            <div
                              className="product-option"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >
                              <label>
                                Talla
                              </label>

                              <select
                                value={
                                  options.size ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  changeOption(
                                    product.id,
                                    "size",
                                    event.target.value
                                  )
                                }
                              >
                                {product.sizes.map(
                                  (
                                    size
                                  ) => (
                                    <option
                                      value={
                                        size
                                      }
                                      key={
                                        size
                                      }
                                    >
                                      {
                                        size
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          )}


                          {product.colors
                            ?.length >
                            0 && (
                            <div
                              className="product-option"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >
                              <label>
                                Color
                              </label>

                              <select
                                value={
                                  options.color ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  changeOption(
                                    product.id,
                                    "color",
                                    event.target.value
                                  )
                                }
                              >
                                {product.colors.map(
                                  (
                                    color
                                  ) => (
                                    <option
                                      value={
                                        color
                                      }
                                      key={
                                        color
                                      }
                                    >
                                      {
                                        color
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          )}


                          <button
                            type="button"
                            className="add-button"
                            disabled={
                              product.stock <=
                              0
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              handleAdd(
                                product
                              );
                            }}
                          >
                            {product.stock >
                            0
                              ? "Agregar al carrito"
                              : "Agotado"}
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </div>
    </section>
  );
}


export default Store;