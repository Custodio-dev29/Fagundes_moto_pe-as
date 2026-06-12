export function getAuthHeaders(includeJson = true) {
    const headers = {};
    if (includeJson) headers['Content-Type'] = 'application/json';
    return headers;
}

export async function fetchWithAuth(url, opts = {}) {
    opts.headers = Object.assign({}, getAuthHeaders(!opts.noJson), opts.headers || {});
    opts.credentials = 'same-origin';
    return fetch(url, opts);
}
