export class InventoryModel {
    constructor() {
        this.storageKey = 'fagundes_inventory_db';
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    getAllProducts() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Erro ao ler estoque:", e);
            return [];
        }
    }

    addProduct(product) {
        const products = this.getAllProducts();
        const normalizedName = product.name.trim().toLowerCase();

        // Validação de nome duplicado
        if (products.some(p => p.name.trim().toLowerCase() === normalizedName)) {
            return { success: false, message: 'Já existe um produto cadastrado com este nome.' };
        }

        // Geração de ID: Usa o fornecido ou gera um automático
        let finalId = product.id?.trim();
        
        if (finalId) {
            if (products.some(p => p.id === finalId)) {
                return { success: false, message: 'Este número de cadastro já está em uso.' };
            }
        } else {
            const numericIds = products.map(p => parseInt(p.id)).filter(id => !isNaN(id));
            const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
            finalId = (maxId + 1).toString();
        }

        const newProduct = {
            id: finalId,
            name: product.name.trim(),
            purchasePrice: parseFloat(product.purchasePrice),
            price: parseFloat(product.price),
            stock: parseInt(product.stock),
            minStock: parseInt(product.minStock),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        localStorage.setItem(this.storageKey, JSON.stringify(products));
        return { success: true, product: newProduct };
    }

    deleteProduct(id) {
        const products = this.getAllProducts();
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    updateStock(id, newStock) {
        const products = this.getAllProducts();
        const product = products.find(p => p.id === id);
        if (product) {
            product.stock = parseInt(newStock);
            product.updatedAt = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(products));
            return { success: true };
        }
        return { success: false, message: 'Produto não encontrado.' };
    }

    updateProduct(id, data) {
        const products = this.getAllProducts();
        const index = products.findIndex(p => p.id === id); // id aqui é o originalId
        
        if (index !== -1) {
            const newId = data.id.trim();
            // Validação de ID duplicado: se o ID mudou, verifica se o novo já existe em outro produto
            if (newId !== id && products.some(p => p.id === newId)) {
                return { success: false, message: 'Este novo número de cadastro já está em uso.' };
            }

            products[index] = {
                ...products[index],
                id: newId,
                name: data.name.trim(),
                purchasePrice: parseFloat(data.purchasePrice),
                price: parseFloat(data.price),
                stock: parseInt(data.stock),
                minStock: parseInt(data.minStock),
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(products));
            return { success: true };
        }
        return { success: false, message: 'Produto não encontrado.' };
    }
}