import axios from "axios";

const api = axios.create({
  baseURL: "/api/laserio",
});

const attachAuth = (config: any) => {
  const token = localStorage.getItem("laserio_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuth);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error.config?.url?.includes("/admin/auth/login")) {
      localStorage.removeItem("laserio_token");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export interface LoginResponse {
  access_token: string;
  expires_in?: number;
  // если бэк вернёт дополнительные поля (user, role и т.п.),
  // их можно будет сюда добавить
}

export default api;
