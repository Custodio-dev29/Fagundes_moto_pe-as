export class AuthModel {
    constructor() {
        // Esta chave funciona como o seu arquivo "login.json" dentro do navegador
        this.storageKey = 'fagundes_users_db';
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    validatePassword(password) {
        return !!(password && password.length >= 8);
    }

    getAllUsers() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Erro ao ler banco de dados:", e);
            return [];
        }
    }

    register(email, password) {
        const users = this.getAllUsers();
        const normalizedEmail = email.toLowerCase().trim();
        
        if (users.find(u => u.email === normalizedEmail)) {
            return { success: false, message: 'Este e-mail já está cadastrado.' };
        }
        
        const newUser = { 
            email: normalizedEmail, 
            password: password,
            createdAt: new Date().toISOString() 
        };
        
        users.push(newUser);
        localStorage.setItem(this.storageKey, JSON.stringify(users));
        
        // Log para você ver o "JSON" no console do navegador (F12)
        console.log("Usuário cadastrado com sucesso! Base de dados atual:", users);
        return { success: true };
    }

    async authenticate(email, password) {
        const users = this.getAllUsers();
        const normalizedEmail = email.toLowerCase().trim();
        const user = users.find(u => u.email === normalizedEmail && u.password === password);

        return new Promise((resolve) => {
            setTimeout(() => resolve(!!user), 800);
        });
    }
}