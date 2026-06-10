import { fetchWithAuth } from './api.js';

export class DashboardController {
    constructor(view) {
        this.view = view;
    }

    async showDashboard() {
        try {
            const response = await fetchWithAuth('/api/reports/dashboard');
            if (!response.ok) throw new Error('Erro ao buscar dados');
            const data = await response.json();
            this.view.render(data);
        } catch (error) {
            console.error('Erro no Dashboard:', error);
        }
    }
}