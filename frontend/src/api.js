import {
  API_URL,
} from "./config";


async function handleResponse(
  response
) {
  if (response.ok) {
    return response.json();
  }


  let message =
    "Ocurrió un error.";


  try {
    const data =
      await response.json();


    if (
      typeof data.detail ===
      "string"
    ) {
      message = data.detail;
    } else if (data.detail) {
      message =
        JSON.stringify(
          data.detail
        );
    }
  } catch {
    message =
      `Error ${response.status}: ${response.statusText}`;
  }


  throw new Error(message);
}


export async function getProducts() {
  const response =
    await fetch(
      `${API_URL}/products`
    );


  return handleResponse(
    response
  );
}


export async function getProduct(
  productId
) {
  const response =
    await fetch(
      `${API_URL}/products/${productId}`
    );


  return handleResponse(
    response
  );
}


export async function checkAdminKey(
  adminKey
) {
  const response =
    await fetch(
      `${API_URL}/admin/check`,
      {
        headers: {
          "X-Admin-Key":
            adminKey,
        },
      }
    );


  return handleResponse(
    response
  );
}


export async function getAdminProducts(
  adminKey
) {
  const response =
    await fetch(
      `${API_URL}/admin/products`,
      {
        headers: {
          "X-Admin-Key":
            adminKey,
        },
      }
    );


  return handleResponse(
    response
  );
}


export async function createProduct(
  product,
  adminKey
) {
  const response =
    await fetch(
      `${API_URL}/products`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "X-Admin-Key":
            adminKey,
        },

        body:
          JSON.stringify(
            product
          ),
      }
    );


  return handleResponse(
    response
  );
}


export async function updateProduct(
  productId,
  product,
  adminKey
) {
  const response =
    await fetch(
      `${API_URL}/products/${productId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          "X-Admin-Key":
            adminKey,
        },

        body:
          JSON.stringify(
            product
          ),
      }
    );


  return handleResponse(
    response
  );
}


export async function deleteProduct(
  productId,
  adminKey
) {
  const response =
    await fetch(
      `${API_URL}/products/${productId}`,
      {
        method: "DELETE",

        headers: {
          "X-Admin-Key":
            adminKey,
        },
      }
    );


  return handleResponse(
    response
  );
}


export async function uploadImage(
  file,
  adminKey
) {
  const formData =
    new FormData();


  formData.append(
    "file",
    file
  );


  const response =
    await fetch(
      `${API_URL}/admin/upload-image`,
      {
        method: "POST",

        headers: {
          "X-Admin-Key":
            adminKey,
        },

        body: formData,
      }
    );


  return handleResponse(
    response
  );
}