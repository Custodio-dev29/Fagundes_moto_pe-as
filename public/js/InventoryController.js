import { showToast, showConfirm, showPrompt } from './utils.js';

export class InventoryController {
    constructor(model, view, authModel) {
        this.model = model;
        this.view = view;
        this.authModel = authModel;
        this.view.bindConfirmUpdate(this.handleConfirmUpdate.bind(this));
        this.view.bindAddProduct(this.handleAddProduct.bind(this));
        this.view.bindConfirmEdit(this.handleConfirmEdit.bind(this), this.handleConfirmDelete.bind(this));
    }

    async showRegistration() {
        const products = await this.model.getAllProducts();
        this.view.renderForm(products);
        this.view.bindUpdateStock((id, val) => this.view.showModal(id, val));
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
        this.view.bindSearch();
        this.currentView = 'registration';
    }

    async showInventory() {
        const products = await this.model.getAllProducts();
        this.view.renderTable(products);
        this.view.bindUpdateStock((id, val) => this.view.showModal(id, val));
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
        this.view.bindSearch();
        this.currentView = 'inventory';
    }

    async handleAddProduct(data) {
        const result = await this.model.addProduct(data);
        
        if (result.success) {
            this.view.closeRegisterModal();
            this.showInventory(); // Redireciona para o estoque para ver o novo item
        } else {
            showToast(`Erro: ${result.message}`, 'error');
        }
    }

    async handleConfirmUpdate(data) {
        const userEmail = localStorage.getItem('currentUser');
        
        // Validação da senha antes de prosseguir
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid && isValid.success) {
            const result = await this.model.updateStock(data.id, data.newStock);
            if (result.success) {
                this.view.closeModal();
                if (this.currentView === 'registration') this.showRegistration();
                else this.showInventory();
            } else {
                showToast(result.message, 'error');
            }
        } else {
            showToast('Senha incorreta! A alteração não foi autorizada.', 'error');
        }
    }

    async handleOpenEditModal(id) {
        const products = await this.model.getAllProducts();
        const product = products.find(p => String(p.id) === String(id));
        if (product) this.view.showEditModal(product);
    }

    async handleConfirmEdit(data) {
        const password = await showPrompt('Confirme sua senha para alterar este produto:');
        if (!password) return;

        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Alteração negada.', 'error');

        const result = await this.model.updateProduct(data.originalId, data);
        if (result.success) {
            this.view.closeEditModal();
            this.refreshCurrentView();
        } else {
            showToast(result.message, 'error');
        }
    }

    async handleConfirmDelete(id) {
        const confirmed = await showConfirm('Tem certeza que deseja excluir permanentemente este produto?');
        if (!confirmed) return;

        const password = await showPrompt('Confirme sua senha para excluir este produto:');
        if (!password) return;

        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Exclusão negada.', 'error');

        await this.model.deleteProduct(id);
        this.view.closeEditModal();
        this.refreshCurrentView();
    }

    refreshCurrentView() {
        if (this.currentView === 'registration') this.showRegistration();
        else this.showInventory();
    }
}