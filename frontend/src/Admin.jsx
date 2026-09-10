import { useEffect, useState } from "react";

import {
  checkAdminKey,
  createProduct,
  deleteProduct,
  getAdminProducts,
  updateProduct,
  uploadImage,
} from "./api";

import "./admin.css";


const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  image: "",
  sizes: "",
  colors: "",
  stock: "",
  featured: false,
  active: true,
};


function formatPrice(price) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(price);
}


function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageStatus, setImageStatus] = useState("");


  // -------------------------------------------------------
  // LOAD SAVED SESSION
  // -------------------------------------------------------

  useEffect(() => {
    const savedKey = sessionStorage.getItem(
      "salysol_admin_key"
    );

    if (savedKey) {
      verifySavedSession(savedKey);
    }
  }, []);


  async function verifySavedSession(key) {
    try {
      setLoading(true);

      await checkAdminKey(key);

      setAdminKey(key);
      setAuthenticated(true);

      const data = await getAdminProducts(key);

      setProducts(data);
    } catch (err) {
      console.error(err);

      sessionStorage.removeItem(
        "salysol_admin_key"
      );

      setAdminKey("");
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }


  // -------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const key = passwordInput.trim();

    if (!key) {
      setError(
        "Escribe la clave de administrador."
      );

      return;
    }

    try {
      setLoading(true);

      await checkAdminKey(key);

      sessionStorage.setItem(
        "salysol_admin_key",
        key
      );

      setAdminKey(key);
      setAuthenticated(true);

      const data = await getAdminProducts(key);

      setProducts(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Clave de administrador incorrecta."
      );
    } finally {
      setLoading(false);
    }
  }


  // -------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------

  function handleLogout() {
    sessionStorage.removeItem(
      "salysol_admin_key"
    );

    setAdminKey("");
    setPasswordInput("");
    setAuthenticated(false);
    setProducts([]);

    resetForm();
  }


  // -------------------------------------------------------
  // LOAD PRODUCTS
  // -------------------------------------------------------

  async function loadProducts() {
    try {
      const data = await getAdminProducts(
        adminKey
      );

      setProducts(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se pudieron cargar los productos."
      );
    }
  }


  // -------------------------------------------------------
  // FORM
  // -------------------------------------------------------

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }


  function resetForm() {
    setForm({
      ...EMPTY_FORM,
    });

    setEditingId(null);
    setImageStatus("");
    setError("");
  }


  function parseList(value) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }


  function validateForm() {
    const name = form.name.trim();

    const price = Number(
      form.price
    );

    const stock = Number(
      form.stock
    );

    const sizes = parseList(
      form.sizes
    );

    const colors = parseList(
      form.colors
    );


    if (name.length < 2) {
      return "Escribe el nombre del bikini.";
    }


    if (
      form.price === "" ||
      Number.isNaN(price) ||
      price <= 0
    ) {
      return "Escribe un precio válido.";
    }


    if (
      form.stock === "" ||
      Number.isNaN(stock) ||
      stock < 0
    ) {
      return "Escribe el inventario disponible.";
    }


    if (sizes.length === 0) {
      return "Agrega al menos una talla.";
    }


    if (colors.length === 0) {
      return "Agrega al menos un color.";
    }


    if (!form.image.trim()) {
      return "Sube una foto del producto.";
    }


    return null;
  }


  function buildPayload() {
    return {
      name: form.name.trim(),

      description:
        form.description.trim(),

      price: Number(form.price),

      image: form.image.trim(),

      sizes: parseList(
        form.sizes
      ),

      colors: parseList(
        form.colors
      ),

      stock: Number(
        form.stock
      ),

      featured:
        form.featured,

      active:
        form.active,
    };
  }


  // -------------------------------------------------------
  // SAVE PRODUCT
  // -------------------------------------------------------

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);

      return;
    }


    const payload =
      buildPayload();


    try {
      setLoading(true);


      if (editingId !== null) {
        await updateProduct(
          editingId,
          payload,
          adminKey
        );

        setMessage(
          "Producto actualizado correctamente."
        );
      } else {
        await createProduct(
          payload,
          adminKey
        );

        setMessage(
          "Producto publicado correctamente."
        );
      }


      setForm({
        ...EMPTY_FORM,
      });

      setEditingId(null);
      setImageStatus("");


      const data =
        await getAdminProducts(
          adminKey
        );

      setProducts(data);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se pudo guardar el producto."
      );

    } finally {
      setLoading(false);
    }
  }


  // -------------------------------------------------------
  // EDIT
  // -------------------------------------------------------

  function handleEdit(product) {
    setEditingId(
      product.id
    );


    setForm({
      name:
        product.name || "",

      description:
        product.description || "",

      price:
        String(
          product.price
        ),

      image:
        product.image || "",

      sizes:
        Array.isArray(
          product.sizes
        )
          ? product.sizes.join(", ")
          : "",

      colors:
        Array.isArray(
          product.colors
        )
          ? product.colors.join(", ")
          : "",

      stock:
        String(
          product.stock
        ),

      featured:
        Boolean(
          product.featured
        ),

      active:
        Boolean(
          product.active
        ),
    });


    setError("");
    setMessage("");
    setImageStatus("");


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------

  async function handleDelete(product) {
    const confirmed =
      window.confirm(
        `¿Eliminar "${product.name}" permanentemente?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setLoading(true);

      setError("");
      setMessage("");


      await deleteProduct(
        product.id,
        adminKey
      );


      setMessage(
        "Producto eliminado correctamente."
      );


      if (
        editingId === product.id
      ) {
        resetForm();
      }


      const data =
        await getAdminProducts(
          adminKey
        );

      setProducts(data);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se pudo eliminar el producto."
      );

    } finally {
      setLoading(false);
    }
  }


  // -------------------------------------------------------
  // IMAGE
  // -------------------------------------------------------

  async function handleImageUpload(
    event
  ) {
    const file =
      event.target.files &&
      event.target.files[0];


    if (!file) {
      return;
    }


    setError("");
    setMessage("");
    setImageStatus("");


    try {
      setUploading(true);


      const result =
        await uploadImage(
          file,
          adminKey
        );


      setForm((current) => ({
        ...current,

        image:
          result.url,
      }));


      setImageStatus(
        "Foto lista. Completa los campos y pulsa Publicar producto."
      );

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se pudo subir la foto."
      );

    } finally {
      setUploading(false);

      event.target.value =
        "";
    }
  }


  // -------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------

  if (!authenticated) {
    return (
      <div className="admin-login-page">
        <form
          className="admin-login-card"
          onSubmit={handleLogin}
        >
          <p className="admin-label">
            SAL Y SOL
          </p>

          <h1>
            Administración
          </h1>

          <p>
            Ingresa la clave para
            administrar la tienda.
          </p>


          <input
            type="password"
            value={passwordInput}
            onChange={(event) =>
              setPasswordInput(
                event.target.value
              )
            }
            placeholder="Clave de administrador"
            autoComplete="current-password"
          />


          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Verificando..."
              : "Entrar"}
          </button>


          <a href="/">
            ← Volver a la tienda
          </a>
        </form>
      </div>
    );
  }


  // -------------------------------------------------------
  // ADMIN PANEL
  // -------------------------------------------------------

  return (
    <div className="admin-page">

      <header className="admin-header">
        <div>
          <p className="admin-label">
            SAL Y SOL
          </p>

          <h1>
            Panel de administración
          </h1>
        </div>


        <div className="admin-header-actions">
          <a href="/">
            Ver tienda
          </a>

          <button
            type="button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>


      <main className="admin-main">

        {/* PRODUCT FORM */}

        <section className="admin-form-section">

          <div className="admin-section-title">
            <div>
              <p className="admin-label">
                PRODUCTO
              </p>

              <h2>
                {editingId !== null
                  ? "Editar bikini"
                  : "Agregar bikini"}
              </h2>
            </div>


            {editingId !== null && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
              >
                Cancelar edición
              </button>
            )}
          </div>


          {message && (
            <div className="admin-success">
              {message}
            </div>
          )}


          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}


          <form
            className="product-form"
            onSubmit={handleSave}
            noValidate
          >

            <div className="form-grid">

              <label>
                Nombre *

                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Bikini Coral"
                />
              </label>


              <label>
                Precio RD$ *

                <input
                  name="price"
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="850"
                />
              </label>


              <label className="full-width">
                Descripción

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder="Descripción del bikini..."
                />
              </label>


              <label>
                Tallas *

                <input
                  name="sizes"
                  type="text"
                  value={
                    form.sizes
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="S, M, L"
                />

                <small>
                  Separadas por coma.
                </small>
              </label>


              <label>
                Colores *

                <input
                  name="colors"
                  type="text"
                  value={
                    form.colors
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Negro, Rosa, Coral"
                />

                <small>
                  Separados por coma.
                </small>
              </label>


              <label>
                Inventario *

                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={
                    form.stock
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="10"
                />
              </label>


              <label>
                URL de imagen

                <input
                  name="image"
                  type="text"
                  value={
                    form.image
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Se llena al subir la foto"
                />
              </label>


              <label className="full-width">
                Foto del producto *

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageUpload
                  }
                  disabled={
                    uploading
                  }
                />

                <small>
                  JPG, PNG o WEBP.
                  Máximo 5 MB.
                </small>
              </label>


              {imageStatus && (
                <div className="admin-image-status full-width">
                  {imageStatus}
                </div>
              )}


              {form.image && (
                <div className="admin-image-preview full-width">
                  <img
                    src={
                      form.image
                    }
                    alt="Vista previa"
                  />
                </div>
              )}


              <label className="checkbox-label">
                <input
                  name="featured"
                  type="checkbox"
                  checked={
                    form.featured
                  }
                  onChange={
                    handleChange
                  }
                />

                Producto destacado
              </label>


              <label className="checkbox-label">
                <input
                  name="active"
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={
                    handleChange
                  }
                />

                Producto activo
              </label>

            </div>


            <button
              type="submit"
              className="save-product-button"
              disabled={
                loading ||
                uploading
              }
            >
              {uploading
                ? "Subiendo foto..."
                : loading
                  ? "Guardando..."
                  : editingId !== null
                    ? "Guardar cambios"
                    : "Publicar producto"}
            </button>


            <p className="required-fields-note">
              * Campos obligatorios
            </p>

          </form>

        </section>


        {/* INVENTORY */}

        <section className="admin-products-section">

          <div className="admin-section-title">
            <div>
              <p className="admin-label">
                INVENTARIO
              </p>

              <h2>
                Productos
              </h2>
            </div>

            <span>
              {products.length}{" "}
              {products.length === 1
                ? "producto"
                : "productos"}
            </span>
          </div>


          {products.length === 0 ? (
            <div className="admin-empty">
              No hay productos todavía.
            </div>
          ) : (
            <div className="admin-product-grid">

              {products.map(
                (product) => (
                  <article
                    key={product.id}
                    className={
                      product.active
                        ? "admin-product-card"
                        : "admin-product-card inactive-product"
                    }
                  >

                    <div className="admin-product-image">

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
                        <div className="admin-placeholder">
                          👙
                        </div>
                      )}

                    </div>


                    <div className="admin-product-body">

                      <div className="admin-product-heading">
                        <h3>
                          {product.name}
                        </h3>

                        <strong>
                          {formatPrice(
                            product.price
                          )}
                        </strong>
                      </div>


                      <p>
                        Stock:{" "}
                        <strong>
                          {product.stock}
                        </strong>
                      </p>


                      <p>
                        Tallas:{" "}
                        {Array.isArray(
                          product.sizes
                        )
                          ? product.sizes.join(
                              ", "
                            )
                          : "N/A"}
                      </p>


                      <p>
                        Colores:{" "}
                        {Array.isArray(
                          product.colors
                        )
                          ? product.colors.join(
                              ", "
                            )
                          : "N/A"}
                      </p>


                      <div className="admin-product-status">

                        <span
                          className={
                            product.active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {product.active
                            ? "Activo"
                            : "Oculto"}
                        </span>


                        {product.featured && (
                          <span>
                            Destacado
                          </span>
                        )}

                      </div>


                      <div className="admin-product-actions">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              product
                            )
                          }
                        >
                          Editar
                        </button>


                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            handleDelete(
                              product
                            )
                          }
                        >
                          Eliminar
                        </button>

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}


export default Admin;