export class CustomerModel {
    constructor() {
        this.apiUrl = '/api/customers';
    }

    async getAll() {
        try {
            const response = await fetch(this.apiUrl);
            return await response.json();
        } catch (e) {
            console.error("Erro ao ler clientes:", e);
            return [];
        }
    }

    async add(customer) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: customer.name.trim(),
                phone: customer.phone.trim()
            })
        });
        return await response.json();
    }

    async update(id, data) {
        const response = await fetch(`${this.apiUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name.trim(),
                phone: data.phone.trim()
            })
        });
        return await response.json();
    }

    async delete(id) {
        const response = await fetch(`${this.apiUrl}/${id}`, { method: 'DELETE' });
        return await response.json();
    }
}