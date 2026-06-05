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
        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            const result = await this.model.update(data.id, {
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

        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            await this.model.delete(data.id);
            this.view.closeEditModal();
            this.showCustomers();
        } else {
            alert('Senha incorreta! Exclusão não autorizada.');
        }
    }
}