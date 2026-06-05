export class SaleController {
    constructor(model, view, customerModel, inventoryModel, authModel) {
        this.model = model;
        this.view = view;
        this.customerModel = customerModel;
        this.inventoryModel = inventoryModel;
        this.authModel = authModel;

        // Eventos vinculados via delegação ou chamadas explícitas no main.js
    }

    async showSales() {
        const sales = await this.model.getAll();
        const customers = await this.customerModel.getAll();
        const products = await this.inventoryModel.getAllProducts();
        
        this.view.render(sales, customers, products);
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
        this.view.bindAddSale(this.handleAddSale.bind(this), products);
        this.view.bindConfirmEdit(this.handleConfirmEdit.bind(this), this.handleConfirmDelete.bind(this), products);
    }

    async handleAddSale(data) {
        const products = await this.inventoryModel.getAllProducts();
        const product = products.find(p => String(p.id) === String(data.productId));
        
        if (!product || product.stock < data.qty) {
            alert('Erro: Quantidade insuficiente em estoque!');
            return;
        }

        const result = await this.model.add(data);
        if (result.success) {
            await this.inventoryModel.updateStock(data.productId, product.stock - data.qty);
            this.view.closeRegisterModal();
            this.showSales();
        } else {
            alert('Erro ao processar venda.');
        }
    }

    async handleOpenEditModal(id) {
        const sales = await this.model.getAll();
        const sale = sales.find(s => String(s.id) === String(id));
        if (sale) {
            const customers = await this.customerModel.getAll();
            const products = await this.inventoryModel.getAllProducts();
            this.view.showEditModal(sale, customers, products);
        }
    }

    async handleConfirmEdit(data) {
        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);
        if (!isValid || !isValid.success) return alert('Senha incorreta!');

        const sales = await this.model.getAll();
        const products = await this.inventoryModel.getAllProducts();
        const customers = await this.customerModel.getAll();

        const oldSale = sales.find(s => String(s.id) === String(data.id));
        const product = products.find(p => String(p.id) === String(data.productId));
        const customer = customers.find(c => String(c.id) === String(data.customerId));

        if (!oldSale || !product) return alert('Erro ao localizar dados da venda ou produto.');

        // Reconciliação de estoque
        if (String(oldSale.productId) === String(data.productId)) {
            const diff = oldSale.qty - data.qty;
            if (product.stock + diff < 0) return alert('Estoque insuficiente para esta alteração!');
            await this.inventoryModel.updateStock(product.id, product.stock + diff);
        } else {
            // Se mudou o produto: devolve o antigo, tira do novo
            const oldProduct = products.find(p => String(p.id) === String(oldSale.productId));
            if (product.stock < data.qty) return alert('Estoque insuficiente no novo produto!');
            if (oldProduct) await this.inventoryModel.updateStock(oldProduct.id, oldProduct.stock + oldSale.qty);
            await this.inventoryModel.updateStock(product.id, product.stock - data.qty);
        }

        data.customerName = customer ? customer.name : 'Cliente Desconhecido';
        data.productName = product ? `#${product.id} - ${product.name}` : 'Produto Desconhecido';

        await this.model.update(data.id, data);
        this.view.closeEditModal();
        this.showSales();
    }

    async handleConfirmDelete(data) {
        if (!confirm('Deseja realmente cancelar esta venda? O estoque será devolvido.')) return;

        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);
        if (!isValid || !isValid.success) return alert('Senha incorreta!');

        const sales = await this.model.getAll();
        const sale = sales.find(s => String(s.id) === String(data.id));
        if (sale) {
            const products = await this.inventoryModel.getAllProducts();
            const product = products.find(p => String(p.id) === String(sale.productId));
            if (product) {
                await this.inventoryModel.updateStock(product.id, product.stock + sale.qty);
            }
            await this.model.delete(data.id);
            this.view.closeEditModal();
            this.showSales();
        }
    }
}