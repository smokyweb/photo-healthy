const BASE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '';

const TOKEN_KEY = 'ph_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const isOverride =
    ['PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());
  const fetchMethod = isOverride ? 'POST' : method.toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
  };

  if (isOverride) {
    headers['X-HTTP-Method-Override'] = method.toUpperCase();
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: fetchMethod,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error || err.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// â”€â”€ Admin proxy (bypasses LiteSpeed WAF) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function adminGet<T = any>(path: string): Promise<T> {
  const proxyPath = `/admin-api-proxy.php?path=${encodeURIComponent(path)}`;
  const res = await fetch(`${BASE_URL}${proxyPath}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error || err.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const login = (email: string, password: string) =>
  request('POST', '/api/auth/login', { email, password });

export const register = (name: string, email: string, password: string) =>
  request('POST', '/api/auth/register', { name, email, password });

export const getMe = () => request('GET', '/api/auth/me');

export const resetPassword = (email: string) =>
  request('POST', '/api/auth/reset-password', { email });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request('PATCH', '/api/auth/change-password', { currentPassword, newPassword });

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getUsers = () => adminGet('/api/users');

export const updateUser = (id: number, data: any) =>
  request('POST', `/admin-user-update.php?id=${id}`, data);

export const deleteUser = (id: number) =>
  request('POST', `/api/users/${id}/delete`);

export const getUserStats = () => request('GET', '/api/users/me/stats');

export const getUserAccess = () => request('GET', '/api/users/me/access');

export const updateProfile = (data: any) =>
  request('PATCH', '/api/auth/me', data);

// â”€â”€ Challenges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getChallenges = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request('GET', `/api/challenges${qs}`);
};

export const getChallenge = (id: number) =>
  request('GET', `/api/challenges/${id}`);

export const createChallenge = (data: any) =>
  request('POST', '/api/challenges', data);

export const updateChallenge = (id: number, data: any) =>
  request('PATCH', `/api/challenges/${id}`, data);

export const deleteChallenge = (id: number) =>
  request('POST', `/api/challenges/${id}/delete`);

export const enterChallenge = (challengeId: number) =>
  request('POST', `/api/challenges/${challengeId}/enter`);

export const getMyChallenges = () =>
  request('GET', '/api/users/me/challenges');

export const getChallengeEnrollment = (challengeId: number) =>
  request('GET', `/api/challenges/${challengeId}/enrollment`);

// â”€â”€ Submissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getSubmissions = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request('GET', `/api/submissions${qs}`);
};

export const getSubmission = (id: number) =>
  request('GET', `/api/submissions/${id}`);

export const createSubmission = (data: any) =>
  request('POST', '/api/submissions', data);

export const updateSubmission = (id: number, data: any) =>
  request('PATCH', `/api/submissions/${id}`, data);

export const deleteSubmission = (id: number) =>
  request('POST', `/api/submissions/${id}/delete`);

export const likeSubmission = (id: number) =>
  request('POST', `/api/submissions/${id}/like`);

// â”€â”€ Comments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getComments = (submissionId: number) =>
  request('GET', `/api/comments?submission_id=${submissionId}`);

export const createComment = (data: any) =>
  request('POST', '/api/comments', data);

export const deleteComment = (id: number) =>
  request('POST', `/api/comments/${id}/delete`);

// â”€â”€ Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createReport = (data: any) =>
  request('POST', '/api/reports', data);

// â”€â”€ Products / Shop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getProducts = () => request('GET', '/api/products');

export const adminGetProducts = () => adminGet('/api/admin/products');

export const createProduct = (data: any) =>
  request('POST', '/api/admin/products', data);

export const updateProduct = (id: number, data: any) =>
  request('PATCH', `/api/admin/products/${id}`, data);

export const deleteProduct = (id: number) =>
  request('DELETE', `/api/admin/products/${id}`);

// â”€â”€ Cart / Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createCheckoutSession = (items: any[]) =>
  request('POST', '/api/checkout/create-session', { items });

export const getMyOrders = () => request('GET', '/api/orders/my');

export const createBundleOrder = (data: any) =>
  request('POST', '/api/orders/bundle', data);

export const adminGetOrders = () => adminGet('/api/admin/orders');

// â”€â”€ Subscription â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getSubscriptionStatus = () =>
  request('GET', '/api/subscription/status');

export const subscribe = (data: any) => request('POST', '/api/subscribe', data);

export const cancelSubscription = () =>
  request('POST', '/api/subscription/cancel');

export const getSubscriptionPortal = () =>
  request('GET', '/api/subscription/portal');

// â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const adminGetDashboardStats = () =>
  adminGet('/api/admin/dashboard-stats');

export const adminGetUsers = () => adminGet('/api/admin/users');

export const adminGetSettings = () => adminGet('/api/admin/settings');

export const adminUpdateSettings = (data: any) =>
  request('POST', '/api/admin/settings', data);

export const adminGetContactSubmissions = () =>
  adminGet('/api/admin/contact-submissions');

export const adminGetPartnerInquiries = () =>
  adminGet('/api/admin/partner-inquiries');

// â”€â”€ Settings (public) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getPublicSettings = () => request('GET', '/api/settings/public');

// â”€â”€ Contact / Partners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const submitContact = (data: any) =>
  request('POST', '/api/contact', data);

export const submitPartnerInquiry = (data: any) =>
  request('POST', '/api/partner-inquiries', data);

// â”€â”€ Photo upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function uploadPhoto(file: File): Promise<{ url: string }> {
  const dataUrl = await resizeImage(file, 1200, 0.82);
  const res = await fetch(`${BASE_URL}/upload.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ data: dataUrl, type: file.type, name: file.name }),
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

function resizeImage(file: File, maxPx: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(file.type || 'image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}
