import api from "../api/client";

export function resolveAssetUrl(url?: string | null) {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = String(api.defaults.baseURL || window.location.origin);
  const origin = new URL(base, window.location.origin).origin;

  return new URL(url, origin).toString();
}
