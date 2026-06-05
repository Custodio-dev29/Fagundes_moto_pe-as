import { fetchWithAuth } from './api.js';

export class InventoryModel {
    constructor() {
        this.apiUrl = '/api/products';
    }

    async getAllProducts() {
        try {
            const response = await fetchWithAuth(this.apiUrl);
            
            if (!response.ok) throw new Error('Acesso negado ou falha na rede');
            return await response.json();
        } catch (e) {
            console.error("Erro ao ler estoque:", e);
            return [];
        }
    }

    async addProduct(product) {
        const response = await fetchWithAuth(this.apiUrl, {
            method: 'POST',
            body: JSON.stringify(product)
        });
        if (!response.ok) return { success: false, message: "Erro ao salvar produto" };
        const result = await response.json();
        return { success: true, product: { ...product, id: result.id } };
    }

    async deleteProduct(id) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}`, { 
            method: 'DELETE'
        });
        if (!response.ok) return { success: false };
        return await response.json();
    }

    async updateStock(id, newStock) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ stock: newStock })
        });
        if (!response.ok) return { success: false };
        return await response.json();
    }

    async updateProduct(id, data) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return await response.json();
    }
}