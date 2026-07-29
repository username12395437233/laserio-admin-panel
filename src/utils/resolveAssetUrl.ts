import api from "../api/client";

export function resolveAssetUrl(url?: string | null) {
  if (!url) return "";

  const base = String(api.defaults.baseURL || window.location.origin);
  const apiUrl = new URL(base, window.location.origin);
  const assetUrl = new URL(url, apiUrl.origin);

  if (!assetUrl.pathname.startsWith("/uploads/")) {
    return assetUrl.toString();
  }

  const apiPath = apiUrl.pathname.replace(/\/$/, "");
  return new URL(`${apiPath}${assetUrl.pathname}`, apiUrl.origin).toString();
}
