export class SaleController {
    constructor(model, view, customerModel, inventoryModel, authModel) {
        this.model = model;
        this.view = view;
        this.customerModel = customerModel;
        this.inventoryModel = inventoryModel;
        this.authModel = authModel;

        this.view.bindAddSale(this.handleAddSale.bind(this), this.inventoryModel.getAllProducts());
        this.view.bindConfirmEdit(this.handleConfirmEdit.bind(this), this.handleConfirmDelete.bind(this), this.inventoryModel.getAllProducts());
    }

    showSales() {
        const sales = this.model.getAll();
        const customers = this.customerModel.getAll();
        const products = this.inventoryModel.getAllProducts();
        
        this.view.render(sales, customers, products);
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
    }

    handleAddSale(data) {
        const product = this.inventoryModel.getAllProducts().find(p => p.id === data.productId);
        const customer = this.customerModel.getAll().find(c => c.id === data.customerId);
        
        if (!product || product.stock < data.quantity) {
            alert('Erro: Quantidade insuficiente em estoque!');
            return;
        }

        // Captura os nomes atuais para o histórico permanente
        data.customerName = customer ? customer.name : 'Cliente Desconhecido';
        data.productName = product.name;

        const result = this.model.add(data);
        if (result.success) {
            // Baixa automática do estoque
            const newStock = product.stock - data.quantity;
            this.inventoryModel.updateStock(data.productId, newStock);

            this.view.closeRegisterModal();
            this.showSales();
        } else {
            alert('Erro ao processar venda.');
        }
    }

    handleOpenEditModal(id) {
        const sale = this.model.getAll().find(s => s.id === id);
        if (sale) {
            this.view.showEditModal(sale, this.customerModel.getAll(), this.inventoryModel.getAllProducts());
        }
    }

    async handleConfirmEdit(data) {
        const userEmail = sessionStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);
        if (!isValid) return alert('Senha incorreta!');

        const oldSale = this.model.getAll().find(s => s.id === data.id);
        const product = this.inventoryModel.getAllProducts().find(p => p.id === data.productId);
        const customer = this.customerModel.getAll().find(c => c.id === data.customerId);

        // Reconciliação de estoque
        if (oldSale.productId === data.productId) {
            const diff = oldSale.quantity - data.quantity;
            if (product.stock + diff < 0) return alert('Estoque insuficiente para esta alteração!');
            this.inventoryModel.updateStock(product.id, product.stock + diff);
        } else {
            // Se mudou o produto: devolve o antigo, tira do novo
            const oldProduct = this.inventoryModel.getAllProducts().find(p => p.id === oldSale.productId);
            if (product.stock < data.quantity) return alert('Estoque insuficiente no novo produto!');
            if (oldProduct) this.inventoryModel.updateStock(oldProduct.id, oldProduct.stock + oldSale.quantity);
            this.inventoryModel.updateStock(product.id, product.stock - data.quantity);
        }

        data.customerName = customer ? customer.name : 'Cliente Desconhecido';
        data.productName = product ? product.name : 'Produto Desconhecido';

        this.model.update(data.id, data);
        this.view.closeEditModal();
        this.showSales();
    }

    async handleConfirmDelete(data) {
        if (!confirm('Deseja realmente cancelar esta venda? O estoque será devolvido.')) return;

        const userEmail = sessionStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);
        if (!isValid) return alert('Senha incorreta!');

        const sale = this.model.getAll().find(s => s.id === data.id);
        if (sale) {
            const product = this.inventoryModel.getAllProducts().find(p => p.id === sale.productId);
            if (product) {
                this.inventoryModel.updateStock(product.id, product.stock + sale.quantity);
            }
            this.model.delete(data.id);
            this.view.closeEditModal();
            this.showSales();
        }
    }
}