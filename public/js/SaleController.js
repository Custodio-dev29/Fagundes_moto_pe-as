export class SaleController {
    constructor(model, view, historyView, customerModel, inventoryModel, authModel) {
        this.model = model;
        this.view = view;
        this.historyView = historyView;
        this.customerModel = customerModel;
        this.inventoryModel = inventoryModel;
        this.authModel = authModel;
    }

    async showSales() {
        const customers = await this.customerModel.getAll();
        const products = await this.inventoryModel.getAllProducts();
        
        // A nova SaleView (PDV) agora recebe apenas clientes e produtos para montar o carrinho
        this.view.render(customers, products);
        this.view.bindAddSale(this.handleAddSale.bind(this), products, customers);
    }

    async showHistory() {
        const sales = await this.model.getAll();
        this.historyView.render(sales);
        // Vincula a ação de exclusão no histórico
        this.historyView.bindEditAction((id) => this.handleDeleteSale(id));
    }

    async handleDeleteSale(id) {
        const saleId = id;
        if (!confirm(`Deseja realmente CANCELAR a venda #${saleId}? O estoque será devolvido automaticamente.`)) return;
        
        const userEmail = localStorage.getItem('currentUser');
        const password = prompt('Para confirmar o cancelamento, digite sua senha:');
        if (!password) return;

        const isValid = await this.authModel.authenticate(userEmail, password);
        if (!isValid || !isValid.success) return alert('Senha incorreta! Cancelamento negado.');

        const result = await this.model.delete(saleId);
        if (result.success) {
            alert('Venda cancelada e estoque estornado com sucesso.');
            this.showHistory();
        } else {
            alert('Erro ao cancelar venda: ' + result.error);
        }
    }

    async handleAddSale(data) {
        // data agora contém { customerId, items: [...], paymentMethod, total }
        const products = await this.inventoryModel.getAllProducts();
        
        // Valida estoque para todos os itens
        for (const item of data.items) {
            const product = products.find(p => String(p.id) === String(item.productId));
            if (!product || product.stock < item.qty) {
                alert(`Estoque insuficiente para: ${product ? product.name : item.productId}`);
                return;
            }
        }

        const result = await this.model.add(data);
        if (result.success) {
            // Atualiza o estoque de cada produto vendido
            for (const item of data.items) {
                const product = products.find(p => String(p.id) === String(item.productId));
                await this.inventoryModel.updateStock(item.productId, product.stock - item.qty);
            }
            alert('Venda finalizada com sucesso!');
            this.showSales();
        } else {
            alert('Erro ao processar venda.');
        }
    }
}