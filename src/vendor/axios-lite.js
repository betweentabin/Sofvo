// Minimal axios-like wrapper using fetch for browser
// Supports: create(), instance.get/post/put/delete/request, interceptors.request/response

const buildQuery = (params) => {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
    else usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
};

class InterceptorManager {
  constructor() { this.handlers = []; }
  use(onFulfilled, onRejected) {
    this.handlers.push({ onFulfilled, onRejected });
    return this.handlers.length - 1;
  }
}

const createInstance = (defaults = {}) => {
  const instance = {};
  instance.defaults = {
    baseURL: '',
    headers: {},
    ...defaults,
  };

  instance.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager(),
  };

  const dispatchRequest = async (config) => {
    let cfg = { ...instance.defaults, ...config };

    // Run request interceptors sequentially
    for (const h of instance.interceptors.request.handlers) {
      if (h.onFulfilled) {
        // allow async
        // eslint-disable-next-line no-await-in-loop
        cfg = await h.onFulfilled(cfg) || cfg;
      }
    }

    const base = (cfg.baseURL || '').replace(/\/$/, '');
    const path = (cfg.url || '').startsWith('/') ? cfg.url : `/${cfg.url || ''}`;
    const fullUrl = `${base}${path}${buildQuery(cfg.params)}`;

    const headers = new Headers();
    const mixin = (obj) => {
      if (!obj) return;
      Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null) headers.set(k, v);
      });
    };
    mixin(instance.defaults.headers);
    mixin(cfg.headers);

    const init = { method: (cfg.method || 'GET').toUpperCase(), headers };

    // Body handling
    if (cfg.data !== undefined && cfg.data !== null && init.method !== 'GET') {
      const isFormData = (typeof FormData !== 'undefined') && (cfg.data instanceof FormData);
      if (isFormData) {
        // Let browser set proper multipart boundary; do not set Content-Type
        headers.delete('Content-Type');
        init.body = cfg.data;
      } else if (headers.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
        init.body = new URLSearchParams(cfg.data).toString();
      } else if (headers.get('Content-Type')?.includes('text/plain')) {
        init.body = String(cfg.data);
      } else {
        headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
        init.body = typeof cfg.data === 'string' ? cfg.data : JSON.stringify(cfg.data);
      }
    }

    let res;
    try {
      res = await fetch(fullUrl, init);
    } catch (networkErr) {
      // Run response error interceptors
      let err = networkErr;
      for (const h of instance.interceptors.response.handlers) {
        if (h.onRejected) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const maybe = await h.onRejected({ config: cfg, message: err.message, isNetworkError: true });
            if (maybe) return maybe;
          } catch (e) {
            err = e;
          }
        }
      }
      throw err;
    }

    let data;
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else if (contentType.startsWith('text/')) {
      data = await res.text();
    } else {
      data = await res.arrayBuffer();
    }

    const response = {
      data,
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      config: cfg,
      url: fullUrl,
    };

    if (!res.ok) {
      let error = { response, config: cfg, message: `Request failed with status code ${res.status}`, status: res.status };
      for (const h of instance.interceptors.response.handlers) {
        if (h.onRejected) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const maybe = await h.onRejected(error);
            if (maybe) return maybe;
          } catch (e) {
            error = e;
          }
        }
      }
      throw error;
    }

    // Run success interceptors
    let final = response;
    for (const h of instance.interceptors.response.handlers) {
      if (h.onFulfilled) {
        // eslint-disable-next-line no-await-in-loop
        final = await h.onFulfilled(final) || final;
      }
    }
    return final;
  };

  instance.request = (config) => dispatchRequest(config);
  instance.get = (url, config = {}) => dispatchRequest({ ...config, method: 'GET', url });
  instance.delete = (url, config = {}) => dispatchRequest({ ...config, method: 'DELETE', url });
  instance.post = (url, data, config = {}) => dispatchRequest({ ...config, method: 'POST', url, data });
  instance.put = (url, data, config = {}) => dispatchRequest({ ...config, method: 'PUT', url, data });

  return instance;
};

const axiosLite = { create: createInstance };

export default axiosLite;

