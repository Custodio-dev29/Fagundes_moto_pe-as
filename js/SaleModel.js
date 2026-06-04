export class SaleModel {
    constructor() {
        this.apiUrl = '/api/sales';
    }

    async getAll() {
        try {
            const response = await fetch(this.apiUrl);
            const sales = await response.json();
            // Mapeia 'qty' de volta para 'quantity' para manter compatibilidade com a View
            return sales.map(s => ({ ...s, quantity: s.qty }));
        } catch (e) {
            console.error("Erro ao ler vendas:", e);
            return [];
        }
    }

    async add(sale) {
        const payload = {
            customerId: sale.customerId,
            productId: sale.productId,
            qty: sale.quantity,
            unitPrice: sale.total / sale.quantity,
            total: sale.total,
            paymentMethod: sale.paymentMethod,
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    }

    async update(id, data) {
        const response = await fetch(`${this.apiUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, qty: data.quantity, unitPrice: data.total / data.quantity })
        });
        return await response.json();
    }

    async delete(id) {
        const response = await fetch(`${this.apiUrl}/${id}`, { method: 'DELETE' });
        return await response.json();
    }
}