export class AuthModel {
    constructor() {
        this.apiUrl = '/api/auth';
    }

    validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    validatePassword(password) {
        return !!(password && password.length >= 8);
    }

    async register(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data && data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', email.toLowerCase().trim());
            }
            return data;
        } catch (e) {
            return { success: false, message: "Erro de conexão com o servidor." };
        }
    }

    async authenticate(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data && data.success && data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', email.toLowerCase().trim());
            }
            return data;
        } catch (e) {
            return false;
        }
    }

    getToken() {
        return localStorage.getItem('authToken');
    }

    clearToken() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}