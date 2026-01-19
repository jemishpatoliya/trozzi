import { api } from "./client";

export async function fetchSizeGuide(category) {
  const cat = String(category || "apparel").trim().toLowerCase();
  const res = await api.get(`/size-guides/${encodeURIComponent(cat)}`);
  return res.data;
}

export async function listSizeGuides() {
  const res = await api.get('/size-guides');
  return res.data;
}
