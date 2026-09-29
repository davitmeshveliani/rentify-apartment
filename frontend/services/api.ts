import axios from 'axios';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = document.cookie
    .split('; ')
    .find((row) =>
      row.startsWith(`${name}=`)
    );

  return value
    ? decodeURIComponent(
        value.substring(name.length + 1)
      )
    : null;
}

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000',

  withCredentials: true,
});

/**
 * Make sure Django has created a CSRF cookie
 * before sending protected requests.
 */
async function ensureCsrfToken(): Promise<string | null> {
  let csrfToken = getCookie('csrftoken');

  if (csrfToken) {
    return csrfToken;
  }

  try {
    await api.get('/api/users/profile/', {
      withCredentials: true,
    });
  } catch {
    // The request may fail because the user is not authenticated,
    // but Django may still have created the CSRF cookie.
  }

  csrfToken = getCookie('csrftoken');

  return csrfToken;
}

api.interceptors.request.use(
  async (config) => {
    const method =
      config.method?.toLowerCase();

    const protectedMethods = [
      'post',
      'put',
      'patch',
      'delete',
    ];

    if (
      method &&
      protectedMethods.includes(method)
    ) {
      const csrfToken =
        await ensureCsrfToken();

      if (csrfToken) {
        config.headers =
          config.headers || {};

        config.headers[
          'X-CSRFToken'
        ] = csrfToken;
      }
    }

    /*
     * JSON requests.
     *
     * Do not set Content-Type manually for FormData.
     * The browser/Axios will set multipart/form-data
     * with the correct boundary automatically.
     */
    if (
      config.data &&
      !(config.data instanceof FormData)
    ) {
      config.headers =
        config.headers || {};

      config.headers[
        'Content-Type'
      ] = 'application/json';
    }

    return config;
  }
);