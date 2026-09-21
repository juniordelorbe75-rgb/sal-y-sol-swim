import {
  useEffect,
  useState,
} from "react";

import {
  checkAdminKey,
  createProduct,
  deleteProduct,
  getAdminProducts,
  updateProduct,
  uploadImage,
} from "./api";

import "./admin.css";


const MAX_IMAGES = 5;

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];


const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",

  // `image` stays for compatibility
  // with Home / Store / Cart.
  image: "",

  // New multiple-image collection.
  images: [],

  sizes: "",
  colors: "",
  stock: "",

  featured: false,
  active: true,
};


function formatPrice(
  price
) {
  return new Intl.NumberFormat(
    "es-DO",
    {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }
  ).format(price);
}


function getProductImages(
  product
) {
  const result = [];

  if (
    product?.image &&
    typeof product.image ===
      "string"
  ) {
    result.push(
      product.image
    );
  }


  if (
    Array.isArray(
      product?.images
    )
  ) {
    product.images.forEach(
      (url) => {
        if (
          typeof url ===
            "string" &&
          url.trim() &&
          !result.includes(
            url.trim()
          )
        ) {
          result.push(
            url.trim()
          );
        }
      }
    );
  }


  return result.slice(
    0,
    MAX_IMAGES
  );
}


function Admin() {
  const [
    adminKey,
    setAdminKey,
  ] = useState("");

  const [
    passwordInput,
    setPasswordInput,
  ] = useState("");

  const [
    authenticated,
    setAuthenticated,
  ] = useState(false);


  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_FORM,
  });

  const [
    editingId,
    setEditingId,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    imageStatus,
    setImageStatus,
  ] = useState("");


  // =====================================================
  // LOAD SAVED SESSION
  // =====================================================

  useEffect(() => {
    const savedKey =
      sessionStorage.getItem(
        "salysol_admin_key"
      );

    if (savedKey) {
      verifySavedSession(
        savedKey
      );
    }
  }, []);


  async function verifySavedSession(
    key
  ) {
    try {
      setLoading(true);

      await checkAdminKey(
        key
      );

      setAdminKey(
        key
      );

      setAuthenticated(
        true
      );

      const data =
        await getAdminProducts(
          key
        );

      setProducts(
        data
      );

    } catch (err) {
      console.error(
        err
      );

      sessionStorage.removeItem(
        "salysol_admin_key"
      );

      setAdminKey(
        ""
      );

      setAuthenticated(
        false
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  // =====================================================
  // LOGIN
  // =====================================================

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    setError("");
    setMessage("");


    const key =
      passwordInput.trim();


    if (!key) {
      setError(
        "Escribe la clave de administrador."
      );

      return;
    }


    try {
      setLoading(
        true
      );


      await checkAdminKey(
        key
      );


      sessionStorage.setItem(
        "salysol_admin_key",
        key
      );


      setAdminKey(
        key
      );

      setAuthenticated(
        true
      );


      const data =
        await getAdminProducts(
          key
        );


      setProducts(
        data
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
          "Clave de administrador incorrecta."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {
    sessionStorage.removeItem(
      "salysol_admin_key"
    );


    setAdminKey(
      ""
    );

    setPasswordInput(
      ""
    );

    setAuthenticated(
      false
    );

    setProducts(
      []
    );


    resetForm();
  }


  // =====================================================
  // FORM
  // =====================================================

  function handleChange(
    event
  ) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setForm(
      (current) => ({
        ...current,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );
  }


  function resetForm() {
    setForm({
      ...EMPTY_FORM,
      images: [],
    });


    setEditingId(
      null
    );

    setImageStatus(
      ""
    );

    setError(
      ""
    );

    setMessage(
      ""
    );
  }


  function parseList(
    value
  ) {
    return value
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  }


  // =====================================================
  // VALIDATION
  // =====================================================

  function validateForm() {
    const name =
      form.name.trim();


    const price =
      Number(
        form.price
      );


    const stock =
      Number(
        form.stock
      );


    const sizes =
      parseList(
        form.sizes
      );


    const colors =
      parseList(
        form.colors
      );


    if (
      name.length < 2
    ) {
      return (
        "Escribe el nombre del bikini."
      );
    }


    if (
      form.price === "" ||
      Number.isNaN(
        price
      ) ||
      price <= 0
    ) {
      return (
        "Escribe un precio válido."
      );
    }


    if (
      form.stock === "" ||
      Number.isNaN(
        stock
      ) ||
      stock < 0
    ) {
      return (
        "Escribe el inventario disponible."
      );
    }


    if (
      sizes.length === 0
    ) {
      return (
        "Agrega al menos una talla."
      );
    }


    if (
      colors.length === 0
    ) {
      return (
        "Agrega al menos un color."
      );
    }


    if (
      !Array.isArray(
        form.images
      ) ||
      form.images.length === 0
    ) {
      return (
        "Sube al menos una foto del producto."
      );
    }


    if (
      form.images.length >
      MAX_IMAGES
    ) {
      return (
        `Puedes usar máximo ${MAX_IMAGES} fotos.`
      );
    }


    return null;
  }


  // =====================================================
  // PAYLOAD
  // =====================================================

  function buildPayload() {
    const cleanImages =
      form.images
        .filter(
          (url) =>
            typeof url ===
              "string" &&
            url.trim()
        )
        .map(
          (url) =>
            url.trim()
        )
        .filter(
          (
            url,
            index,
            array
          ) =>
            array.indexOf(
              url
            ) === index
        )
        .slice(
          0,
          MAX_IMAGES
        );


    return {
      name:
        form.name.trim(),

      description:
        form.description.trim(),

      price:
        Number(
          form.price
        ),

      // First image is always
      // the product cover.
      image:
        cleanImages[0] ||
        "",

      images:
        cleanImages,

      sizes:
        parseList(
          form.sizes
        ),

      colors:
        parseList(
          form.colors
        ),

      stock:
        Number(
          form.stock
        ),

      featured:
        form.featured,

      active:
        form.active,
    };
  }


  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  async function handleSave(
    event
  ) {
    event.preventDefault();


    setError(
      ""
    );

    setMessage(
      ""
    );


    const validationError =
      validateForm();


    if (
      validationError
    ) {
      setError(
        validationError
      );

      return;
    }


    const payload =
      buildPayload();


    try {
      setLoading(
        true
      );


      if (
        editingId !== null
      ) {
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
        images: [],
      });


      setEditingId(
        null
      );

      setImageStatus(
        ""
      );


      const data =
        await getAdminProducts(
          adminKey
        );


      setProducts(
        data
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
          "No se pudo guardar el producto."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  // =====================================================
  // EDIT
  // =====================================================

  function handleEdit(
    product
  ) {
    const productImages =
      getProductImages(
        product
      );


    setEditingId(
      product.id
    );


    setForm({
      name:
        product.name ||
        "",

      description:
        product.description ||
        "",

      price:
        String(
          product.price
        ),

      image:
        productImages[0] ||
        "",

      images:
        productImages,

      sizes:
        Array.isArray(
          product.sizes
        )
          ? product.sizes.join(
              ", "
            )
          : "",

      colors:
        Array.isArray(
          product.colors
        )
          ? product.colors.join(
              ", "
            )
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


    setError(
      ""
    );

    setMessage(
      ""
    );

    setImageStatus(
      productImages.length
        ? (
            `${productImages.length} foto${
              productImages.length === 1
                ? ""
                : "s"
            } cargada${
              productImages.length === 1
                ? ""
                : "s"
            }.`
          )
        : ""
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  async function handleDelete(
    product
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar "${product.name}" permanentemente?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      setMessage(
        ""
      );


      await deleteProduct(
        product.id,
        adminKey
      );


      setMessage(
        "Producto eliminado correctamente."
      );


      if (
        editingId ===
        product.id
      ) {
        resetForm();
      }


      const data =
        await getAdminProducts(
          adminKey
        );


      setProducts(
        data
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
          "No se pudo eliminar el producto."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  // =====================================================
  // MULTIPLE IMAGE UPLOAD
  // =====================================================

  async function handleImageUpload(
    event
  ) {
    const files =
      Array.from(
        event.target.files ||
          []
      );


    if (
      files.length === 0
    ) {
      return;
    }


    setError(
      ""
    );

    setMessage(
      ""
    );


    const currentCount =
      form.images.length;


    const remaining =
      MAX_IMAGES -
      currentCount;


    if (
      remaining <= 0
    ) {
      setError(
        `Ya tienes el máximo de ${MAX_IMAGES} fotos.`
      );

      event.target.value =
        "";

      return;
    }


    if (
      files.length >
      remaining
    ) {
      setError(
        `Solo puedes agregar ${remaining} foto${
          remaining === 1
            ? ""
            : "s"
        } más. El máximo es ${MAX_IMAGES}.`
      );

      event.target.value =
        "";

      return;
    }


    const invalidType =
      files.find(
        (file) =>
          !ALLOWED_IMAGE_TYPES.includes(
            file.type
          )
      );


    if (
      invalidType
    ) {
      setError(
        `La foto "${invalidType.name}" no es JPG, PNG o WEBP.`
      );

      event.target.value =
        "";

      return;
    }


    const oversizedFile =
      files.find(
        (file) =>
          file.size >
          MAX_FILE_SIZE
      );


    if (
      oversizedFile
    ) {
      setError(
        `La foto "${oversizedFile.name}" pesa más de 5 MB.`
      );

      event.target.value =
        "";

      return;
    }


    try {
      setUploading(
        true
      );


      for (
        let index = 0;
        index <
        files.length;
        index += 1
      ) {
        const file =
          files[index];


        setImageStatus(
          `Subiendo foto ${
            index + 1
          } de ${
            files.length
          }...`
        );


        const result =
          await uploadImage(
            file,
            adminKey
          );


        setForm(
          (current) => {
            const nextImages = [
              ...current.images,
              result.url,
            ]
              .filter(
                Boolean
              )
              .filter(
                (
                  url,
                  imageIndex,
                  array
                ) =>
                  array.indexOf(
                    url
                  ) ===
                  imageIndex
              )
              .slice(
                0,
                MAX_IMAGES
              );


            return {
              ...current,

              images:
                nextImages,

              image:
                nextImages[0] ||
                "",
            };
          }
        );
      }


      const finalCount =
        currentCount +
        files.length;


      setImageStatus(
        `${finalCount} foto${
          finalCount === 1
            ? ""
            : "s"
        } lista${
          finalCount === 1
            ? ""
            : "s"
        }. La primera será la portada.`
      );

    } catch (err) {
      console.error(
        err
      );


      setError(
        err.message ||
          "No se pudieron subir todas las fotos."
      );


      setImageStatus(
        "Algunas fotos pudieron haberse subido. Revisa las vistas previas."
      );

    } finally {
      setUploading(
        false
      );


      event.target.value =
        "";
    }
  }


  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  function handleRemoveImage(
    indexToRemove
  ) {
    setForm(
      (current) => {
        const nextImages =
          current.images.filter(
            (
              _,
              index
            ) =>
              index !==
              indexToRemove
          );


        return {
          ...current,

          images:
            nextImages,

          image:
            nextImages[0] ||
            "",
        };
      }
    );


    setImageStatus(
      "Foto eliminada del producto. Guarda los cambios para confirmar."
    );
  }


  // =====================================================
  // MAKE IMAGE COVER
  // =====================================================

  function handleMakeCover(
    index
  ) {
    setForm(
      (current) => {
        if (
          index <= 0 ||
          index >=
            current.images.length
        ) {
          return current;
        }


        const selected =
          current.images[index];


        const nextImages = [
          selected,

          ...current.images.filter(
            (
              _,
              imageIndex
            ) =>
              imageIndex !==
              index
          ),
        ];


        return {
          ...current,

          images:
            nextImages,

          image:
            selected,
        };
      }
    );


    setImageStatus(
      "Portada actualizada. Guarda el producto para confirmar."
    );
  }


  // =====================================================
  // LOGIN SCREEN
  // =====================================================

  if (
    !authenticated
  ) {
    return (
      <div className="admin-login-page">

        <form
          className="admin-login-card"

          onSubmit={
            handleLogin
          }
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

            value={
              passwordInput
            }

            onChange={(
              event
            ) =>
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

            disabled={
              loading
            }
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


  // =====================================================
  // ADMIN PANEL
  // =====================================================

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

            onClick={
              handleLogout
            }
          >
            Cerrar sesión
          </button>

        </div>

      </header>


      <main className="admin-main">


        {/* ===============================================
            PRODUCT FORM
        =============================================== */}

        <section className="admin-form-section">

          <div className="admin-section-title">

            <div>
              <p className="admin-label">
                PRODUCTO
              </p>


              <h2>
                {editingId !==
                null
                  ? "Editar bikini"
                  : "Agregar bikini"}
              </h2>
            </div>


            {editingId !==
              null && (
              <button
                type="button"

                className="admin-secondary-button"

                onClick={
                  resetForm
                }
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

            onSubmit={
              handleSave
            }

            noValidate
          >

            <div className="form-grid">


              {/* NAME */}

              <label>
                Nombre *

                <input
                  name="name"

                  type="text"

                  value={
                    form.name
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="Bikini Coral"
                />
              </label>


              {/* PRICE */}

              <label>
                Precio RD$ *

                <input
                  name="price"

                  type="number"

                  min="1"

                  value={
                    form.price
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="850"
                />
              </label>


              {/* DESCRIPTION */}

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


              {/* SIZES */}

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


              {/* COLORS */}

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


              {/* STOCK */}

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


              {/* =========================================
                  MULTIPLE IMAGES
              ========================================= */}

              <label className="full-width">

                Fotos del producto *


                <input
                  type="file"

                  accept="image/jpeg,image/jpg,image/png,image/webp"

                  multiple

                  onChange={
                    handleImageUpload
                  }

                  disabled={
                    uploading ||
                    form.images.length >=
                      MAX_IMAGES
                  }
                />


                <small>
                  Puedes seleccionar varias fotos a la vez.
                  Máximo {MAX_IMAGES} fotos.
                  JPG, PNG o WEBP.
                  Máximo 5 MB por foto.
                </small>

              </label>


              {/* IMAGE STATUS */}

              {imageStatus && (
                <div className="admin-image-status full-width">
                  {imageStatus}
                </div>
              )}


              {/* =========================================
                  IMAGE PREVIEWS
              ========================================= */}

              {form.images.length >
                0 && (

                <div
                  className="full-width"

                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(140px, 1fr))",

                    gap:
                      "12px",

                    marginTop:
                      "6px",
                  }}
                >

                  {form.images.map(
                    (
                      imageUrl,
                      index
                    ) => (

                    <div
                      key={
                        `${imageUrl}-${index}`
                      }

                      style={{
                        border:
                          index === 0
                            ? "2px solid #d7a24a"
                            : "1px solid #e5e5e5",

                        borderRadius:
                          "12px",

                        overflow:
                          "hidden",

                        background:
                          "#fff",

                        padding:
                          "8px",
                      }}
                    >

                      <img
                        src={
                          imageUrl
                        }

                        alt={
                          `Foto ${
                            index + 1
                          } del producto`
                        }

                        style={{
                          width:
                            "100%",

                          height:
                            "160px",

                          objectFit:
                            "cover",

                          borderRadius:
                            "8px",

                          display:
                            "block",
                        }}
                      />


                      <div
                        style={{
                          marginTop:
                            "8px",

                          display:
                            "flex",

                          gap:
                            "6px",

                          flexWrap:
                            "wrap",
                        }}
                      >

                        {index === 0 ? (

                          <span
                            style={{
                              fontSize:
                                "12px",

                              fontWeight:
                                "700",

                              padding:
                                "7px 9px",

                              borderRadius:
                                "7px",

                              background:
                                "#fff2d6",
                            }}
                          >
                            Portada
                          </span>

                        ) : (

                          <button
                            type="button"

                            onClick={() =>
                              handleMakeCover(
                                index
                              )
                            }

                            style={{
                              fontSize:
                                "12px",
                            }}
                          >
                            Usar portada
                          </button>

                        )}


                        <button
                          type="button"

                          className="delete-button"

                          onClick={() =>
                            handleRemoveImage(
                              index
                            )
                          }

                          style={{
                            fontSize:
                              "12px",
                          }}
                        >
                          Quitar
                        </button>

                      </div>

                    </div>

                  ))}

                </div>
              )}


              {/* FEATURED */}

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


              {/* ACTIVE */}

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


            {/* SAVE */}

            <button
              type="submit"

              className="save-product-button"

              disabled={
                loading ||
                uploading
              }
            >

              {uploading
                ? "Subiendo fotos..."
                : loading
                  ? "Guardando..."
                  : editingId !==
                      null
                    ? "Guardar cambios"
                    : "Publicar producto"}

            </button>


            <p className="required-fields-note">
              * Campos obligatorios
            </p>

          </form>

        </section>


        {/* ===============================================
            INVENTORY
        =============================================== */}

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

              {products.length ===
              1
                ? "producto"
                : "productos"}
            </span>

          </div>


          {products.length ===
          0 ? (

            <div className="admin-empty">
              No hay productos todavía.
            </div>

          ) : (

            <div className="admin-product-grid">

              {products.map(
                (
                  product
                ) => {

                  const productImages =
                    getProductImages(
                      product
                    );


                  return (

                    <article
                      key={
                        product.id
                      }

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
                          Fotos:{" "}

                          <strong>
                            {
                              productImages.length
                            }
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

                  );
                }
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}


export default Admin;