import { AuthModel } from './AuthModel.js';
import { AuthView } from './AuthView.js';
import { AuthController } from './AuthController.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new AuthController(new AuthModel(), new AuthView());
});