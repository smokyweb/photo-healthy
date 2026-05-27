const BASE_URL = 'https://photoai.betaplanets.com';

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

async function adminPut<T = any>(path: string, body?: any): Promise<T> {
  const proxyPath = `/admin-api-proxy.php?path=${encodeURIComponent(path)}&method=PUT`;
  const res = await fetch(`${BASE_URL}${proxyPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const err = await res.json(); msg = err.error || err.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const login = (email: string, password: string) =>
  request('POST', '/api/auth/login', { email, password });

export const register = (name: string, email: string, password: string) =>
  request('POST', '/api/auth/register', { name, email, password });

export const getMe = () => request('GET', '/api/auth/me');

export const resetPassword = (email: string) =>
  request('POST', '/admin-api-proxy.php?path=/api/auth/forgot-password&method=POST', { email });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request('POST', '/admin-api-proxy.php?path=/api/auth/change-password&method=PATCH', { currentPassword, newPassword });

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getUsers = () => adminGet('/api/users');

export const updateUser = (id: number, data: any) =>
  request('POST', `/admin-user-update.php?id=${id}`, data);

export const adminResetPassword = (id: number) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/users/' + id + '/reset-password&method=POST', {});

export const deleteUser = (id: number) =>
  request('POST', `/admin-api-proxy.php?path=/api/users/${id}/delete&method=POST`);

export const adminCreateUser = (data: any) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/users&method=POST', data);


export const getUserStats = () => request('GET', '/api/users/me/stats');

export const getUserAccess = () => request('GET', '/api/users/me/access');

export const updateProfile = (data: any) =>
  request('POST', '/admin-api-proxy.php?path=/api/auth/profile&method=PUT', data);

// â”€â”€ Challenges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getChallenges = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request('GET', `/api/challenges${qs}`);
};

export const getChallenge = (id: number) =>
  request('GET', `/api/challenges/${id}`);

export const createChallenge = (data: any) =>
  request('POST', '/admin-api-proxy.php?path=/api/challenges&method=POST', data);

export const updateChallenge = (id: number, data: any) =>
  request('POST', `/admin-api-proxy.php?path=/api/challenges/${id}&method=PUT`, data);

export const deleteChallenge = (id: number) =>
  request('POST', `/admin-api-proxy.php?path=/api/challenges/${id}/delete&method=POST`);

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
  request('POST', `/admin-api-proxy.php?path=/api/submissions/${id}&method=PATCH`, data);

export const deleteSubmission = (id: number) =>
  request('POST', `/admin-api-proxy.php?path=/api/submissions/${id}/delete&method=POST`);

export const likeSubmission = (id: number) =>
  request('POST', `/api/submissions/${id}/like`);

// â”€â”€ Comments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getComments = (submissionId: number) =>
  request('GET', `/api/comments?submission_id=${submissionId}`);

export const createComment = (data: any) =>
  request('POST', '/api/comments', data);

export const deleteComment = (id: number) =>
  request('POST', `/api/comments/${id}/delete`);

export const updateComment = (id: number, text: string) =>
  request('POST', `/admin-api-proxy.php?path=/api/comments/${id}&method=PATCH`, { text });

export const adminSuspendUser = (id: number, suspended: boolean, reason?: string) =>
  request('POST', `/admin-api-proxy.php?path=/api/admin/users/${id}/suspend&method=POST`, { suspended, reason });

// â”€â”€ Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createReport = (data: any) =>
  request('POST', '/api/reports', data);

// â”€â”€ Products / Shop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getProducts = () => request('GET', '/api/products');

export const adminGetProducts = () => adminGet('/api/admin/products');

export const createProduct = (data: any) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/products&method=POST', data);

export const updateProduct = (id: number, data: any) =>
  request('POST', `/admin-api-proxy.php?path=/api/admin/products/${id}&method=PATCH`, data);

export const deleteProduct = (id: number) =>
  request('POST', `/admin-api-proxy.php?path=/api/admin/products/${id}&method=DELETE`);

// â”€â”€ Cart / Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createCheckoutSession = (items: any[], options?: { couponCode?: string; giftCode?: string }) =>
  request('POST', '/api/checkout/create-session', {
    items,
    coupon_code: options?.couponCode || null,
    gift_code: options?.giftCode || null,
  });

export const getMyOrders = () => request('GET', '/api/orders/my');
export const getMyNotifications = () => request('GET', '/api/notifications/my');

export const createBundleOrder = (data: any) =>
  request('POST', '/api/orders/bundle', data);


export const adminGetOrders = (params?: any) => adminGet('/api/admin/orders' + (params ? '?' + Object.entries(params).map(([k,v]) => k+'='+encodeURIComponent(String(v))).join('&') : ''));
export const adminMarkOrderPaid = (id: number) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/orders/' + id + '/mark-paid&method=PATCH', {});
export const adminProcessOrder = (id: number) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/orders/' + id + '/process&method=POST', {});
export const adminFulfillOrder = (id: number, tracking_number: string) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/orders/' + id + '/fulfill&method=POST', { tracking_number });
export const adminUpdateTracking = (id: number, tracking_number: string) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/orders/' + id + '/tracking&method=PATCH', { tracking_number });

// Admin activity & user detail endpoints
export const adminGetActivity = () => adminGet('/api/admin/activity');
export const adminGetUserSubmissions = (userId: number) => adminGet(`/api/admin/users/${userId}/submissions`);
export const adminGetUserComments = (userId: number) => adminGet(`/api/admin/users/${userId}/comments`);
export const adminGetUserOrders = (userId: number) => adminGet(`/api/admin/users/${userId}/orders`);

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

export const adminGetUsers = () => adminGet('/api/users');

export const adminGetSettings = () => adminGet('/api/admin/settings');
export const getTaxonomy = () => request('GET', '/api/taxonomy');
export const adminGetTaxonomy = () => adminGet('/api/admin/taxonomy');
export const adminUpdateTaxonomy = (key: string, items: string[]) =>
  adminPut('/api/admin/taxonomy', { key, items });

export const adminUpdateSettings = (data: any) =>
  request('POST', '/admin-api-proxy.php?path=/api/admin/settings&method=POST', data);

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
  const data = await res.json();
  const url = data?.url || data?.photo_url || data?.image_url || data?.file_url || data?.file || data?.path || data?.location;
  if (!url) throw new Error('Upload failed: server did not return a photo URL');
  return { ...data, url };
}

// Read EXIF orientation from JPEG (fixes iPhone rotation)
function getExifOrientation(buffer) {
  try {
    const view = new DataView(buffer);
    if (view.getUint16(0, false) !== 0xFFD8) return 1;
    let offset = 2;
    while (offset < view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xFFE1) {
        if (view.getUint32(offset + 2, false) !== 0x45786966) return 1;
        const little = view.getUint16(offset + 8, false) === 0x4949;
        const tags = view.getUint16(offset + 14, little);
        for (let i = 0; i < tags; i++) {
          const tag = view.getUint16(offset + 16 + (i * 12), little);
          if (tag === 0x0112) return view.getUint16(offset + 16 + (i * 12) + 8, little);
        }
      } else if ((marker & 0xFF00) !== 0xFF00) break;
      else offset += view.getUint16(offset, false);
    }
  } catch {}
  return 1;
}

function resizeImage(file: File, maxPx: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const isHeic = type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif');

    const url = URL.createObjectURL(file);

    const drawWithOrientation = (img: HTMLImageElement, orientation: number) => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const swap = orientation >= 5 && orientation <= 8;
      let tw = swap ? height : width, th = swap ? width : height;
      if (tw > maxPx || th > maxPx) {
        const scale = maxPx / Math.max(tw, th);
        tw = Math.round(tw * scale); th = Math.round(th * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      const cw = canvas.width, ch = canvas.height;
      switch (orientation) {
        case 2: ctx.transform(-1,0,0,1,cw,0); break;
        case 3: ctx.transform(-1,0,0,-1,cw,ch); break;
        case 4: ctx.transform(1,0,0,-1,0,ch); break;
        case 5: ctx.transform(0,1,1,0,0,0); break;
        case 6: ctx.transform(0,1,-1,0,cw,0); break;
        case 7: ctx.transform(0,-1,-1,0,cw,ch); break;
        case 8: ctx.transform(0,-1,1,0,0,ch); break;
      }
      ctx.drawImage(img, 0, 0, swap ? th : tw, swap ? tw : th);
      ctx.restore();
      const outType = (isHeic || type.includes('jpeg') || type.includes('jpg')) ? 'image/jpeg' : type.includes('png') ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outType, quality));
    };

    if (isHeic) {
      // Try direct render (works in Safari), fail gracefully in other browsers
      const img = new Image();
      img.onload = () => drawWithOrientation(img, 1);
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('HEIC photos not supported in this browser. Please set your iPhone camera to capture in JPEG mode (Settings > Camera > Formats > Most Compatible).')); };
      img.src = url;
    } else {
      // For JPEG: read EXIF orientation first
      const reader = new FileReader();
      reader.onload = (e) => {
        const buf = e.target?.result as ArrayBuffer;
        const orientation = getExifOrientation(buf);
        const img = new Image();
        img.onload = () => drawWithOrientation(img, orientation);
        img.onerror = reject;
        img.src = url;
      };
      reader.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to read image')); };
      reader.readAsArrayBuffer(file);
    }
  });
}
