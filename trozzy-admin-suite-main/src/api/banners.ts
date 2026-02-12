import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

export interface AdminBanner {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendBanner {
  _id?: string;
  id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  linkUrl?: string;
  position?: string;
  active?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : undefined,
  };
}

export async function uploadAdminBannerImage(file: File) {
  const form = new FormData();
  form.append('image', file);

  const response = await axios.post(`${API_BASE_URL}/admin/banners/upload`, form, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = response.data;
  if (!data?.success || !data?.url) {
    throw new Error(data?.message || 'Failed to upload banner image');
  }
  return String(data.url);
}

function normalizeBanner(b: BackendBanner): AdminBanner {
  const apiOrigin = API_BASE_URL.replace(/\/?api\/?$/, '');
  const rawImage = (b.imageUrl ?? b.image) || '';
  const imageUrl = typeof rawImage === 'string' && rawImage.startsWith('/') ? `${apiOrigin}${rawImage}` : String(rawImage);

  return {
    id: String(b.id ?? b._id ?? ''),
    title: String(b.title ?? ''),
    imageUrl,
    link: String(b.link ?? b.linkUrl ?? ''),
    position: String(b.position ?? ''),
    active: Boolean(b.active),
    order: Number.isFinite(Number(b.order)) ? Number(b.order) : 0,
    createdAt: String(b.createdAt ?? new Date().toISOString()),
    updatedAt: String(b.updatedAt ?? new Date().toISOString()),
  };
}

export async function fetchAdminBanners(params?: { position?: string; active?: boolean }) {
  const response = await axios.get(`${API_BASE_URL}/admin/banners`, {
    headers: getAuthHeaders(),
    params: {
      ...(params?.position ? { position: params.position } : {}),
      ...(params?.active !== undefined ? { active: String(params.active) } : {}),
    },
  });

  const data = response.data;
  const list = Array.isArray(data?.banners) ? data.banners : Array.isArray(data) ? data : [];
  return list.map(normalizeBanner);
}

export async function createAdminBanner(input: {
  title: string;
  imageUrl: string;
  position: string;
  active: boolean;
  order: number;
}) {
  const response = await axios.post(
    `${API_BASE_URL}/admin/banners/json`,
    {
      title: input.title,
      position: input.position,
      image: input.imageUrl,
      link: '',
      active: input.active,
      order: input.order,
    },
    { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } },
  );

  const banner = response.data?.banner;
  return banner ? normalizeBanner(banner) : null;
}

export async function updateAdminBanner(
  id: string,
  input: {
    title: string;
    imageUrl: string;
    position: string;
    active: boolean;
    order: number;
  },
) {
  const response = await axios.put(
    `${API_BASE_URL}/admin/banners/${encodeURIComponent(id)}/json`,
    {
      title: input.title,
      position: input.position,
      image: input.imageUrl,
      link: '',
      active: input.active,
      order: input.order,
    },
    { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } },
  );

  const banner = response.data?.banner;
  return banner ? normalizeBanner(banner) : null;
}

export async function deleteAdminBanner(id: string) {
  await axios.delete(`${API_BASE_URL}/admin/banners/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });
}
