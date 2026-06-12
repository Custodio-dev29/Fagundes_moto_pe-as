import { showToast, showConfirm, showPrompt } from './utils.js';

export class NFEntryController {
    constructor(model, view, inventoryModel, authModel) {
        this.model = model;
        this.view = view;
        this.inventoryModel = inventoryModel;
        this.authModel = authModel;
    }

    async showNFEntries() {
        const entries = await this.model.getAll();
        const products = await this.inventoryModel.getAllProducts();
        this.view.render(entries, products);
        this.view.bindFormSubmit(this.handleAddNF.bind(this), this.handleEditNF.bind(this), products);
        this.view.bindSearch();
        this.view.bindEditNF();
        this.view.bindModalDelete(this.handleDeleteNF.bind(this));
    }

    async handleAddNF(data) {
        const result = await this.model.add(data);
        if (result.success) {
            this.view.closeModal();
            showToast('Entrada de NF registrada com sucesso!', 'success');
            this.showNFEntries();
        } else {
            showToast('Erro ao registrar entrada de NF.', 'error');
        }
    }

    async handleEditNF(id, data) {
        const userEmail = localStorage.getItem('currentUser');
        const password = await showPrompt('Confirme sua senha para alterar esta entrada de NF:');
        if (!password) return;

        const isValid = await this.authModel.authenticate(userEmail, password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Alteração negada.', 'error');

        const result = await this.model.update(id, data);
        if (result.success) {
            this.view.closeModal();
            showToast('Entrada de NF atualizada com sucesso!', 'success');
            this.showNFEntries();
        } else {
            showToast('Erro ao atualizar entrada de NF.', 'error');
        }
    }

    async handleDeleteNF(id) {
        const confirmed = await showConfirm(`Deseja realmente excluir esta entrada de NF? O estoque será ajustado automaticamente.`);
        if (!confirmed) return;

        const userEmail = localStorage.getItem('currentUser');
        const password = await showPrompt('Para confirmar a exclusão, digite sua senha:');
        if (!password) return;

        const isValid = await this.authModel.authenticate(userEmail, password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Exclusão negada.', 'error');

        const result = await this.model.delete(id);
        if (result.success) {
            showToast('Entrada de NF excluída com sucesso!', 'success');
            this.showNFEntries();
        } else {
            showToast('Erro ao excluir entrada de NF.', 'error');
        }
    }
}