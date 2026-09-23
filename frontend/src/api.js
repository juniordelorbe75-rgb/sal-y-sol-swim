import { API_URL } from "./config";

function buildUrl(path) {
  const base = API_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(buildUrl(path), options);

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  return data;
}

function adminHeaders(adminKey, extraHeaders = {}) {
  return {
    "X-Admin-Key": adminKey,
    ...extraHeaders,
  };
}

export async function getProducts(featured) {
  const params = new URLSearchParams();

  if (typeof featured === "boolean") {
    params.set("featured", String(featured));
  }

  const query = params.toString();

  return apiRequest(
    `/products${query ? `?${query}` : ""}`
  );
}

export async function getProduct(productId) {
  return apiRequest(
    `/products/${encodeURIComponent(productId)}`
  );
}

export async function checkAdminKey(adminKey) {
  return apiRequest("/admin/check", {
    headers: adminHeaders(adminKey),
  });
}

export async function getAdminProducts(adminKey) {
  return apiRequest("/admin/products", {
    headers: adminHeaders(adminKey),
  });
}

export async function createProduct(payload, adminKey) {
  return apiRequest("/products", {
    method: "POST",
    headers: adminHeaders(adminKey, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  productId,
  payload,
  adminKey
) {
  return apiRequest(
    `/products/${encodeURIComponent(productId)}`,
    {
      method: "PUT",
      headers: adminHeaders(adminKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteProduct(productId, adminKey) {
  return apiRequest(
    `/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: adminHeaders(adminKey),
    }
  );
}

export async function uploadImage(file, adminKey) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/admin/upload-image", {
    method: "POST",
    headers: adminHeaders(adminKey),
    body: formData,
  });
}
