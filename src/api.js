const API_URL =  "http://13.60.157.78:5000/api";
// import.meta.env.VITE_API_URL ||

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage = Array.isArray(data.errors)
      ? data.errors.map((item) => item.message).join(", ")
      : "";
    throw new Error(validationMessage || data.message || "Request failed");
  }

  return data;
};

export const apiRequest = (path, options = {}, token) => {
  const headers = {
    ...(!(options.body instanceof FormData) && { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers
  }).then(parseResponse);
};

