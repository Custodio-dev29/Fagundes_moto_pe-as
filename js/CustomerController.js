export class CustomerController {
    constructor(model, view, authModel) {
        this.model = model;
        this.view = view;
        this.authModel = authModel;

        // Vincula eventos permanentes dos modais (que estão no HTML estático)
        this.view.bindAddCustomer(this.handleAddCustomer.bind(this));
        this.view.bindConfirmEdit(this.handleConfirmEdit.bind(this), this.handleConfirmDelete.bind(this));
    }

    showCustomers() {
        const customers = this.model.getAll();
        this.view.render(customers);
        
        // Re-vincula eventos de delegação da tabela
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
    }

    handleAddCustomer(data) {
        this.model.add(data);
        this.view.closeRegisterModal();
        this.showCustomers();
    }

    handleOpenEditModal(id) {
        const customer = this.model.getAll().find(c => c.id === id);
        if (customer) this.view.showEditModal(customer);
    }

    async handleConfirmEdit(data) {
        const userEmail = sessionStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            const result = this.model.update(data.id, {
                name: data.name,
                phone: data.phone
            });
            if (result.success) {
                this.view.closeEditModal();
                this.showCustomers();
            } else {
                alert(result.message);
            }
        } else {
            alert('Senha incorreta!');
        }
    }

    async handleConfirmDelete(data) {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

        const userEmail = sessionStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            this.model.delete(data.id);
            this.view.closeEditModal();
            this.showCustomers();
        } else {
            alert('Senha incorreta! Exclusão não autorizada.');
        }
    }
}