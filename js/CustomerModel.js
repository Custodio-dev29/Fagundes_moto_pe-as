export class CustomerModel {
    constructor() {
        this.storageKey = 'fagundes_customers_db';
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Erro ao ler clientes:", e);
            return [];
        }
    }

    add(customer) {
        const customers = this.getAll();
        
        const newCustomer = {
            id: Date.now().toString(),
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            createdAt: new Date().toISOString()
        };
        
        customers.push(newCustomer);
        localStorage.setItem(this.storageKey, JSON.stringify(customers));
        return { success: true, customer: newCustomer };
    }

    update(id, data) {
        const customers = this.getAll();
        const index = customers.findIndex(c => c.id === id);
        
        if (index !== -1) {
            customers[index] = {
                ...customers[index],
                name: data.name.trim(),
                phone: data.phone.trim(),
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(customers));
            return { success: true };
        }
        return { success: false, message: 'Cliente não encontrado.' };
    }

    delete(id) {
        const customers = this.getAll();
        const filtered = customers.filter(c => c.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        return { success: true };
    }
}