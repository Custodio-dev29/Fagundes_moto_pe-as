import { fetchWithAuth } from './api.js';

export class CashClosureController {
    constructor(view) {
        this.view = view;
    }

    async showClosure(start = '', end = '') {
        try {
            const query = start && end ? `?start=${start}&end=${end}` : '';
            
            const [closureRes, topRes] = await Promise.all([
                fetchWithAuth(`/api/reports/cash-closure${query}`),
                fetchWithAuth(`/api/reports/top-products${query}`)
            ]);

            if (!closureRes.ok || !topRes.ok) {
                throw new Error('Falha ao obter dados do servidor');
            }

            const [dataRaw, topProductsRaw] = await Promise.all([
                closureRes.json(),
                topRes.json()
            ]);

            const data = Array.isArray(dataRaw) ? dataRaw : [];
            const topProducts = Array.isArray(topProductsRaw) ? topProductsRaw : [];

            this.view.render(data, topProducts, start, end);
            this.view.bindFilter((s, e) => this.showClosure(s, e));
        } catch (error) {
            console.error('Erro no Fechamento de Caixa:', error);
        }
    }
}