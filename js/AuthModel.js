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
            return await response.json();
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
            return data.success;
        } catch (e) {
            return false;
        }
    }
}