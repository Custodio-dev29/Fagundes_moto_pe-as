import { AuthModel } from './AuthModel.js';
import { AuthView } from './AuthView.js';
import { AuthController } from './AuthController.js';

// Limpa Service Workers na tela de login também
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new AuthController(new AuthModel(), new AuthView());
});