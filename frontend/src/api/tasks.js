// In Docker (Nginx) or Vite dev on port 5173, requests use relative paths proxied to backend:5000
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (
  typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '')
    ? ''
    : 'http://localhost:5000'
);

function getAuthHeader() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = window.localStorage.getItem('token');
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(options.headers || {})
      },
    });
  } catch {
    throw new Error('Cannot reach the API. Check that the backend is running on port 5000.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `Request failed (${response.status})`);
  return body;
}

export const getTasks = () => request('/tasks');
export const createTask = (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id, task) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' });
export const getCacheStats = () => request('/api/cache/stats');
