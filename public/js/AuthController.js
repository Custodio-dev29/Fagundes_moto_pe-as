import { showToast } from './utils.js';

export class AuthController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        // Vincula os eventos da view ao controller
        this.view.bindToggle(this.handleToggle.bind(this));
        this.view.bindSubmit(this.handleLogin.bind(this));
    }

    handleToggle() {
        // Limpa todos os erros visuais ao alternar entre Login e Cadastro
        this.view.displayError('email', false);
        this.view.displayError('password', false);
        this.view.displayError('confirmPassword', false);
        this.view.toggleAuthMode();
    }

    async handleLogin(data) {
        const isLogin = this.view.isLoginMode;
        const isEmailValid = this.model.validateEmail(data.email?.trim());
        // No login, apenas checamos se a senha foi preenchida. No cadastro, validamos a força (8 chars).
        const isPasswordValid = isLogin ? data.password.length > 0 : this.model.validatePassword(data.password);
        let isConfirmValid = true;

        if (!isLogin) {
            isConfirmValid = data.password === data.confirmPassword;
            this.view.displayError('confirmPassword', !isConfirmValid);
        }

        this.view.displayError('email', !isEmailValid);
        this.view.displayError('password', !isPasswordValid);

        if (isEmailValid && isPasswordValid && isConfirmValid) {
            this.view.setLoading(true);

            if (isLogin) {
                const result = await this.model.authenticate(data.email, data.password);
                if (result && result.success) {
                    // O AuthModel já salva o token, aqui garantimos a persistência do e-mail
                    const email = (result.user && result.user.email) ? result.user.email : data.email.toLowerCase().trim();
                    localStorage.setItem('currentUser', email);
                    window.location.replace('main.html');
                } else {
                    this.view.setLoading(false);
                    showToast('Erro: Usuário ou senha incorretos.', 'error');
                }
            } else {
                const result = await this.model.register(data.email, data.password);
                this.view.setLoading(false);

                if (result.success) {
                    showToast('Cadastro realizado com sucesso!', 'success');
                    this.view.toggleAuthMode();
                } else {
                    showToast(`Erro: ${result.message}`, 'error');
                }
            }
        } else {
            showToast('Por favor, verifique os campos destacados em vermelho.', 'warning');
        }
    }
}