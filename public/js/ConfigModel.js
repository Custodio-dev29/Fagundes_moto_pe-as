import { fetchWithAuth } from './api.js';

export class ConfigModel {
    constructor() {
        this.apiUrl = '/api/settings';
    }

    async getSettings() {
        try {
            const response = await fetchWithAuth(this.apiUrl);
            return await response.json();
        } catch (e) {
            console.error("Erro ao carregar configurações:", e);
            return { maxBackups: 5, backupInterval: 24 };
        }
    }

    async updateSettings(data) {
        const response = await fetchWithAuth(this.apiUrl, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return await response.json();
    }
}