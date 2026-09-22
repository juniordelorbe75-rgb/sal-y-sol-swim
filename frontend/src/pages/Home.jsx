import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getProducts,
} from "../api";

import {
  INSTAGRAM_URL,
} from "../config";


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


function Home() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getProducts();

        setProducts(data);
      } catch (err) {
        setError(
          err.message ||
            "No pudimos cargar la colección."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);


  const previewProducts =
    useMemo(() => {
      return [...products]
        .sort((a, b) => {
          if (
            a.stock > 0 &&
            b.stock <= 0
          ) {
            return -1;
          }

          if (
            a.stock <= 0 &&
            b.stock > 0
          ) {
            return 1;
          }

          if (
            a.featured &&
            !b.featured
          ) {
            return -1;
          }

          if (
            !a.featured &&
            b.featured
          ) {
            return 1;
          }

          return b.id - a.id;
        })
        .slice(0, 4);
    }, [products]);


  return (
    <>
      {/* HERO */}

      <section className="boutique-hero">
        <div className="hero-overlay">
          <p>
            SAL Y SOL SWIM
          </p>

          <h1>
            TRAJES DE BAÑO
            <br />
            PARA CADA
            <br />
            MOMENTO BAJO EL SOL
          </h1>

          <Link
            to="/tienda"
            className="collection-button"
          >
            VER COLECCIÓN
          </Link>
        </div>
      </section>


      {/* COLLECTION */}

      <section className="home-collection">
        <div className="tropical-decoration tropical-decoration-one">
          ☼
        </div>

        <div className="center-heading">
          <p className="section-label">
            SAL Y SOL
          </p>

          <h2>
            Explora nuestra colección
          </h2>

          <p>
            Diseños para sentirte cómoda,
            femenina y lista para disfrutar
            cada momento bajo el sol.
          </p>
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
          previewProducts.length === 0 && (
            <div className="message">
              Nuestra colección estará
              disponible muy pronto.
            </div>
          )}


        {!loading &&
          !error &&
          previewProducts.length > 0 && (
            <div className="home-product-grid">
              {previewProducts.map(
                (product) => (
                   <Link
                      to={`/producto/${product.id}`}
                      className="home-product-card"
                      key={product.id}
                    >
                    <div className="home-product-image">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                        />
                      ) : (
                        <div className="image-placeholder">
                          Sal y Sol
                        </div>
                      )}

                      {product.featured && (
                        <span className="home-featured-badge">
                          FAVORITO
                        </span>
                      )}
                    </div>

                    <div className="home-product-info">
                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {formatPrice(
                          product.price
                        )}
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}


        <div className="collection-footer">
          <Link
            to="/tienda"
            className="outline-button"
          >
            VER TODOS LOS BIKINIS
          </Link>
        </div>
      </section>


      {/* BENEFITS */}

      <section className="sunshine-section">
        <div className="sunshine-intro">
          <p className="section-label">
            HECHO PARA EL SOL
          </p>

          <h2>
            Tu próximo favorito
            está aquí.
          </h2>

          <p>
            Encuentra el estilo,
            talla y color que mejor
            combine contigo.
          </p>
        </div>


        <div className="benefits-section">
          <div className="benefit-item">
            <span>♡</span>

            <div className="benefit-title">
              <h3>
                Elige tu favorito
              </h3>
            </div>

            <p>
              Descubre modelos,
              colores y tallas.
            </p>
          </div>


          <div className="benefit-item">
            <span>☀</span>

            <div className="benefit-title">
              <h3>
                Compra fácil
              </h3>
            </div>

            <p>
              Agrega tus piezas
              favoritas al carrito.
            </p>
          </div>


          <div className="benefit-item">
            <span>☏</span>

            <div className="benefit-title">
              <h3>
                Ordena por WhatsApp
              </h3>
            </div>

            <p>
              Confirmamos tu pedido
              directamente contigo.
            </p>
          </div>


          <div className="benefit-item">
            <span>✦</span>

            <div className="benefit-title">
              <h3>
                Envíos nacionales
                e internacionales
              </h3>
            </div>

            <p>
              Enviamos dentro y fuera
              de República Dominicana.
            </p>
          </div>
        </div>
      </section>


      {/* INSTAGRAM */}

      <section className="follow-section">
        <div className="follow-palm">
          ❧
        </div>

        <p className="section-label">
          INSTAGRAM
        </p>

        <h2>
          Síguenos bajo el sol
        </h2>

        <p>
          Nuevos bikinis,
          disponibilidad,
          promociones y momentos
          Sal y Sol.
        </p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="instagram-button"
        >
          @sal.y.sol_swim
        </a>
      </section>
    </>
  );
}


export default Home;