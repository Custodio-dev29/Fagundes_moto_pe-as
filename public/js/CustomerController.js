import { showToast, showConfirm, showPrompt } from './utils.js';

export class CustomerController {
    constructor(model, view, authModel) {
        this.model = model;
        this.view = view;
        this.authModel = authModel;

        // Vincula eventos permanentes dos modais (que estão no HTML estático)
        this.view.bindAddCustomer(this.handleAddCustomer.bind(this));
        this.view.bindConfirmEdit(this.handleConfirmEdit.bind(this), this.handleConfirmDelete.bind(this));
    }

    async showCustomers() {
        const customers = await this.model.getAll();
        this.view.render(customers);
        
        // Re-vincula eventos de delegação da tabela
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
    }

    async handleAddCustomer(data) {
        await this.model.add(data);
        this.view.closeRegisterModal();
        this.showCustomers();
    }

    async handleOpenEditModal(id) {
        const customers = await this.model.getAll();
        const customer = customers.find(c => String(c.id) === String(id));
        if (customer) this.view.showEditModal(customer);
    }

    async handleConfirmEdit(data) {
        const password = await showPrompt('Confirme sua senha para alterar este cliente:');
        if (!password) return;

        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Alteração negada.', 'error');

        const result = await this.model.update(data.id, {
            name: data.name,
            phone: data.phone,
            document: data.document,
            ie: data.ie,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode
        });
        if (result.success) {
            this.view.closeEditModal();
            this.showCustomers();
        } else {
            showToast(result.message, 'error');
        }
    }

    async handleConfirmDelete(id) {
        const confirmed = await showConfirm('Tem certeza que deseja excluir este cliente?');
        if (!confirmed) return;

        const password = await showPrompt('Confirme sua senha para excluir este cliente:');
        if (!password) return;

        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Exclusão negada.', 'error');

        await this.model.delete(id);
        this.view.closeEditModal();
        this.showCustomers();
    }
}