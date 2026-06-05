export function getAuthHeaders(includeJson = true) {
    const headers = {};
    if (includeJson) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export async function fetchWithAuth(url, opts = {}) {
    opts.headers = Object.assign({}, getAuthHeaders(!opts.noJson), opts.headers || {});
    return fetch(url, opts);
}
