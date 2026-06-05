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
        this.currentView = 'registration';
    }

    async showInventory() {
        const products = await this.model.getAllProducts();
        this.view.renderTable(products);
        this.view.bindUpdateStock((id, val) => this.view.showModal(id, val));
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
        this.currentView = 'inventory';
    }

    async handleAddProduct(data) {
        const result = await this.model.addProduct(data);
        
        if (result.success) {
            this.view.closeRegisterModal();
            this.showInventory(); // Redireciona para o estoque para ver o novo item
        } else {
            alert(`Erro: ${result.message}`);
        }
    }

    async handleConfirmUpdate(data) {
        const userEmail = localStorage.getItem('currentUser');
        
        // Validação da senha antes de prosseguir
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            const result = await this.model.updateStock(data.id, data.newStock);
            if (result.success) {
                this.view.closeModal();
                if (this.currentView === 'registration') this.showRegistration();
                else this.showInventory();
            } else {
                alert(result.message);
            }
        } else {
            alert('Senha incorreta! A alteração não foi autorizada.');
        }
    }

    async handleOpenEditModal(id) {
        const products = await this.model.getAllProducts();
        const product = products.find(p => String(p.id) === String(id));
        if (product) this.view.showEditModal(product);
    }

    async handleConfirmEdit(data) {
        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            const result = await this.model.updateProduct(data.originalId, data);
            if (result.success) {
                this.view.closeEditModal();
                this.refreshCurrentView();
            } else {
                alert(result.message);
            }
        } else {
            alert('Senha incorreta!');
        }
    }

    async handleConfirmDelete(data) {
        if (!confirm('Tem certeza que deseja excluir permanentemente este produto?')) return;

        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            await this.model.deleteProduct(data.id);
            this.view.closeEditModal();
            this.refreshCurrentView();
        } else {
            alert('Senha incorreta! Exclusão não autorizada.');
        }
    }

    refreshCurrentView() {
        if (this.currentView === 'registration') this.showRegistration();
        else this.showInventory();
    }
}