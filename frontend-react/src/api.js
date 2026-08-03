export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { ...options.headers, ...authHeaders() }
    });

    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
        throw new Error('Session expired');
    }

    return res;
}
