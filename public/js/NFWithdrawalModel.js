import { fetchWithAuth } from './api.js';

export class NFWithdrawalModel {
    constructor() {
        this.apiUrl = '/api/nf-withdrawal';
    }

    async getAll() {
        try {
            const response = await fetchWithAuth(this.apiUrl);
            return await response.json();
        } catch (e) {
            console.error("Erro ao ler NF de saída:", e);
            return [];
        }
    }

    async getById(id) {
        try {
            const response = await fetchWithAuth(`${this.apiUrl}/${id}`);
            return await response.json();
        } catch (e) {
            console.error("Erro ao ler NF:", e);
            return null;
        }
    }

    async create(data) {
        const response = await fetchWithAuth(this.apiUrl, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    async cancel(id) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}/cancel`, {
            method: 'PUT'
        });
        return await response.json();
    }

    async getBySale(saleId) {
        try {
            const response = await fetchWithAuth(`${this.apiUrl}/sale/${saleId}`);
            return await response.json();
        } catch (e) {
            console.error("Erro ao buscar NF por venda:", e);
            return null;
        }
    }

    async getByPeriod(start, end) {
        try {
            const params = new URLSearchParams();
            if (start) params.append('start', start);
            if (end) params.append('end', end);
            const response = await fetchWithAuth(`${this.apiUrl}?${params.toString()}`);
            return await response.json();
        } catch (e) {
            console.error("Erro ao buscar NF por período:", e);
            return [];
        }
    }

    async getNextNumber() {
        try {
            const response = await fetchWithAuth(`${this.apiUrl}/next-number`);
            const data = await response.json();
            return data.nextNumber;
        } catch (e) {
            console.error("Erro ao obter próximo número NF:", e);
            return null;
        }
    }

    async transmit(id) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}/transmit`, {
            method: 'PUT'
        });
        return await response.json();
    }

    async contingency(id, justification) {
        const response = await fetchWithAuth(`${this.apiUrl}/${id}/contingency`, {
            method: 'POST',
            body: JSON.stringify({ justification })
        });
        return await response.json();
    }

    async getXmlDownloadUrl(id) {
        return `${this.apiUrl}/${id}/xml`;
    }

}
