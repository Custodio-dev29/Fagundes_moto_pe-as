import { fetchWithAuth } from './api.js';

export class NFEntryModel {
    constructor() {
        this.apiUrl = '/api/nf-entries';
    }

    async getAll() {
        try {
            const response = await fetchWithAuth(this.apiUrl);
            return await response.json();
        } catch (e) {
            console.error("Erro ao ler histórico de NF:", e);
            return [];
        }
    }

    async add(entry) {
        const response = await fetchWithAuth(this.apiUrl, {
            method: 'POST',
            body: JSON.stringify(entry)
        });
        return await response.json();
    }
}