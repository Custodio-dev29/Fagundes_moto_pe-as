export class SaleModel {
    constructor() {
        this.storageKey = 'fagundes_sales_db';
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Erro ao ler vendas:", e);
            return [];
        }
    }

    add(sale) {
        const sales = this.getAll();
        const newSale = {
            id: Date.now().toString(),
            customerId: sale.customerId,
            customerName: sale.customerName,
            productId: sale.productId,
            productName: sale.productName,
            paymentMethod: sale.paymentMethod,
            quantity: sale.quantity,
            total: sale.total,
            date: new Date().toISOString()
        };
        sales.push(newSale);
        localStorage.setItem(this.storageKey, JSON.stringify(sales));
        return { success: true, sale: newSale };
    }

    update(id, data) {
        const sales = this.getAll();
        const index = sales.findIndex(s => s.id === id);
        if (index !== -1) {
            sales[index] = {
                ...sales[index],
                customerId: data.customerId,
                customerName: data.customerName,
                productId: data.productId,
                productName: data.productName,
                paymentMethod: data.paymentMethod,
                quantity: data.quantity,
                total: data.total,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(sales));
            return { success: true };
        }
        return { success: false };
    }

    delete(id) {
        const sales = this.getAll();
        const filtered = sales.filter(s => s.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        return { success: true };
    }
}