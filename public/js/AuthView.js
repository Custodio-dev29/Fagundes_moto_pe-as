export class AuthView {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.confirmGroup = document.getElementById('confirm-password-group');
        this.submitBtn = document.getElementById('submitBtn');
        this.toggleBtn = document.getElementById('toggle-auth');
        this.authTitle = document.getElementById('auth-title');
        this.toggleText = document.getElementById('toggle-text');
        
        // Verifica se deve iniciar como cadastro (útil para a register.html)
        const initialMode = localStorage.getItem('auth_initial_mode');
        this.isLoginMode = initialMode !== 'register';
        localStorage.removeItem('auth_initial_mode'); // Limpa após usar
        
        // Aplica o estado inicial visual
        if (!this.isLoginMode) this.applyUIState();
    }

    getFormData() {
        return {
            email: this.emailInput.value,
            password: this.passwordInput.value,
            confirmPassword: this.confirmPasswordInput?.value
        };
    }

    toggleAuthMode() {
        this.isLoginMode = !this.isLoginMode;
        this.applyUIState();
    }

    applyUIState() {
        if (this.confirmGroup) this.confirmGroup.style.display = this.isLoginMode ? 'none' : 'block';
        if (this.authTitle) this.authTitle.innerText = this.isLoginMode ? 'Fagundes Moto Peças' : 'Criar Conta';
        if (this.submitBtn) this.submitBtn.innerText = this.isLoginMode ? 'Acessar Sistema' : 'Cadastrar';

        if (this.toggleText) {
            this.toggleText.innerHTML = this.isLoginMode
                ? 'Não tem uma conta? <a href="#" id="toggle-auth">Cadastre-se</a>'
                : 'Já tem uma conta? <a href="#" id="toggle-auth">Faça Login</a>';
        }

        this.toggleBtn = document.getElementById('toggle-auth');
    }

    displayError(field, hasError) {
        const errorDiv = document.getElementById(`${field}Error`);
        if (errorDiv) errorDiv.style.display = hasError ? 'block' : 'none';
        
        const input = this[`${field}Input`];
        if (input) {
            input.classList.toggle('invalid', hasError);
            input.setAttribute('aria-invalid', hasError);
        }
    }

    setLoading(isLoading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = isLoading;
            this.submitBtn.innerText = isLoading ? "Processando..." : (this.isLoginMode ? "Acessar Sistema" : "Cadastrar");
        }
    }

    bindSubmit(handler) {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            handler(this.getFormData());
        });
    }

    bindToggle(handler) {
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'toggle-auth') {
                const href = e.target.getAttribute('href');
                if (!href || href === '#') {
                    e.preventDefault();
                    handler();
                }
            }
        });
    }
}