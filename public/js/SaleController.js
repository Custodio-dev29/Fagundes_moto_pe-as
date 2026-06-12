import { showToast, showConfirm, showPrompt } from './utils.js';

export class SaleController {
    constructor(model, view, historyView, customerModel, inventoryModel, authModel, nfWithdrawalModel, nfWithdrawalController) {
        this.model = model;
        this.view = view;
        this.historyView = historyView;
        this.customerModel = customerModel;
        this.inventoryModel = inventoryModel;
        this.authModel = authModel;
        this.nfWithdrawalModel = nfWithdrawalModel;
        this.nfWithdrawalController = nfWithdrawalController;
    }

    async showSales() {
        const customers = await this.customerModel.getAll();
        const products = await this.inventoryModel.getAllProducts();
        
        this.view.render(customers, products);
        this.view.bindAddSale(this.handleAddSale.bind(this), products, customers);
    }

    async showHistory() {
        const [sales, nfs] = await Promise.all([
            this.model.getAll(),
            this.nfWithdrawalModel.getAll()
        ]);
        const nfMap = {};
        nfs.forEach(nf => { nfMap[nf.saleId] = nf; });
        this.historyView.render(sales, nfMap);
        this.historyView.bindEditAction(
            (id) => this.handleDeleteSale(id),
            (nfId) => this.handleViewNF(nfId),
            (saleId) => this.handleEmitNF(saleId)
        );
    }

    async handleViewNF(nfId) {
        const nf = await this.nfWithdrawalModel.getById(nfId);
        if (nf) this.nfWithdrawalController.view.showModal(nf);
    }

    async handleEmitNF(saleId) {
        await this.nfWithdrawalController.openModalForSale(saleId);
    }

    async handleDeleteSale(id) {
        if (this._deleting) return;
        this._deleting = true;
        try {
            const confirmed = await showConfirm(`Deseja realmente CANCELAR a venda #${id}? O estoque será devolvido automaticamente.`);
            if (!confirmed) return;
            
            const userEmail = localStorage.getItem('currentUser');
            const password = await showPrompt('Para confirmar o cancelamento, digite sua senha:');
            if (!password) return;

            const isValid = await this.authModel.authenticate(userEmail, password);
            if (!isValid || !isValid.success) return showToast('Senha incorreta! Cancelamento negado.', 'error');

            const result = await this.model.delete(id);
            if (result.success) {
                showToast('Venda cancelada e estoque estornado com sucesso.', 'success');
                this.showHistory();
            } else {
                showToast('Erro ao cancelar venda: ' + result.error, 'error');
            }
        } finally {
            this._deleting = false;
        }
    }

    async handleAddSale(data) {
        const products = await this.inventoryModel.getAllProducts();
        
        for (const item of data.items) {
            const product = products.find(p => String(p.id) === String(item.productId));
            if (!product || product.stock < item.qty) {
                showToast(`Estoque insuficiente para: ${product ? product.name : item.productId}`, 'warning');
                return;
            }
        }

        const result = await this.model.add(data);
        if (result.success) {
            for (const item of data.items) {
                const product = products.find(p => String(p.id) === String(item.productId));
                await this.inventoryModel.updateStock(item.productId, product.stock - item.qty);
            }
            showToast('Venda finalizada com sucesso!', 'success');

            const emitirNF = await showConfirm('Deseja emitir NF para esta venda?');
            if (emitirNF) {
                await this.nfWithdrawalController.openModalForSale(result.id);
            }
            this.showSales();
        } else {
            showToast('Erro ao processar venda.', 'error');
        }
    }
}