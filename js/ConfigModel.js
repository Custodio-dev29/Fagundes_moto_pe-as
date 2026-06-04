export class ConfigModel {
    constructor() {
        this.apiUrl = '/api/settings';
    }

    async getSettings() {
        try {
            const response = await fetch(this.apiUrl);
            return await response.json();
        } catch (e) {
            console.error("Erro ao carregar configurações:", e);
            return { maxBackups: 5, backupInterval: 24 };
        }
    }

    async updateSettings(data) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
}