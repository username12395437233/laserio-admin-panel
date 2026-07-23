import axios from "axios";

const api = axios.create({
  baseURL: "http://77.105.169.22/api/laserio",
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

export interface LoginResponse {
  access_token: string;
  expires_in?: number;
  // если бэк вернёт дополнительные поля (user, role и т.п.),
  // их можно будет сюда добавить
}

export default api;
