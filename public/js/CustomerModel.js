import { getAuthHeaders, fetchWithAuth } from './api.js';

export class CustomerModel {
    constructor() {
        this.apiUrl = '/api/customers';
    }

    async getAll() {
        try {
            const response = await fetchWithAuth(this.apiUrl);
            return await response.json();
        } catch (e) {
            console.error("Erro ao ler clientes:", e);
            return [];
        }
    }

    async add(customer) {
        const response = await fetchWithAuth(this.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                name: customer.name.trim(),
                phone: customer.phone.trim()
            })
        });
        return await response.json();
    }

    async update(id, data) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: data.name.trim(),
                phone: data.phone.trim()
            })
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