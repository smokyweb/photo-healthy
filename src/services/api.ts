const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : '';

let authToken: string | null = null;

export const setToken = (token: string | null) => {
  authToken = token;
  if (token) {
    try { localStorage.setItem('ph_token', token); } catch {}
  } else {
    try { localStorage.removeItem('ph_token'); } catch {}
  }
};

export const getStoredToken = (): string | null => {
  try { return localStorage.getItem('ph_token'); } catch { return null; }
};

const request = async (path: string, options: RequestInit = {}) => {
  const headers: any = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// Resize and compress an image to a max dimension, returning a base64 JPEG data URL
const resizeImage = (file: File, maxSize = 600, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions keeping aspect ratio
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        // Draw to canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const upload = async (file: File): Promise<string> => {
  // Compress/resize image first (profile photos: max 600px, ~50-100KB output)
  const base64 = await resizeImage(file, 600, 0.82);
  const headers: any = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}/api/upload-base64`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: base64, type: 'image/jpeg', name: file.name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
};

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/api/auth/me'),
  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Challenges
  getChallenges: () => request('/api/challenges'),
  getChallenge: (id: number) => request(`/api/challenges/${id}`),
  createChallenge: (data: any) =>
    request('/api/challenges', { method: 'POST', body: JSON.stringify(data) }),
  updateChallenge: (id: number, data: any) =>
    request(`/api/challenges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChallenge: (id: number) =>
    request(`/api/challenges/${id}`, { method: 'DELETE' }),

  // Submissions
  getSubmissions: (challengeId?: number) =>
    request(`/api/submissions${challengeId ? `?challenge_id=${challengeId}` : ''}`),
  getSubmission: (id: number) => request(`/api/submissions/${id}`),
  createSubmission: (data: any) =>
    request('/api/submissions', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubmission: (id: number) =>
    request(`/api/submissions/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (submissionId: number) =>
    request(`/api/comments?submission_id=${submissionId}`),
  createComment: (submissionId: number, text: string) =>
    request('/api/comments', { method: 'POST', body: JSON.stringify({ submission_id: submissionId, text }) }),
  deleteComment: (id: number) =>
    request(`/api/comments/${id}`, { method: 'DELETE' }),

  // Users (admin)
  getUsers: () => request('/api/users'),
  updateUser: (id: number, data: any) =>
    request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request(`/api/users/${id}`, { method: 'DELETE' }),

  // Upload
  uploadPhoto: upload,

  // Subscriptions
  createCheckout: (plan: string) =>
    request('/api/subscribe', { method: 'POST', body: JSON.stringify({ plan }) }),
};
