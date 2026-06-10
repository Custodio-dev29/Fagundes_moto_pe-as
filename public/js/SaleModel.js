import { fetchWithAuth } from './api.js';
export class SaleModel {
    constructor() {
        this.apiUrl = '/api/sales';
    }

    async getAll() {
        try {
            const response = await fetchWithAuth(this.apiUrl);
            return await response.json();
        } catch (e) {
            console.error("Erro ao ler vendas:", e);
            return [];
        }
    }

    async add(sale) {
        const response = await fetchWithAuth(this.apiUrl, {
            method: 'POST',
            body: JSON.stringify(sale)
        });
        return await response.json();
    }

    async update(id, data) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, qty: data.qty, unitPrice: data.total / data.qty })
        });
        return await response.json();
    }

    async delete(id) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}`, { 
            method: 'DELETE'
        });
        return await response.json();
    }
}