export class InventoryController {
    constructor(model, view, authModel) {
        this.model = model;
        this.view = view;
        this.authModel = authModel;
        this.view.bindConfirmUpdate(this.handleConfirmUpdate.bind(this));
        this.view.bindAddProduct(this.handleAddProduct.bind(this));
        this.view.bindConfirmEdit(this.handleConfirmEdit.bind(this), this.handleConfirmDelete.bind(this));
    }

    showRegistration() {
        const products = this.model.getAllProducts();
        this.view.renderForm(products);
        this.view.bindUpdateStock((id, val) => this.view.showModal(id, val));
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
        this.currentView = 'registration';
    }

    showInventory() {
        const products = this.model.getAllProducts();
        this.view.renderTable(products);
        this.view.bindUpdateStock((id, val) => this.view.showModal(id, val));
        this.view.bindEditAction((id) => this.handleOpenEditModal(id));
        this.currentView = 'inventory';
    }

    handleAddProduct(data) {
        const result = this.model.addProduct(data);
        
        if (result.success) {
            this.view.closeRegisterModal();
            this.showInventory(); // Redireciona para o estoque para ver o novo item
        } else {
            alert(`Erro: ${result.message}`);
        }
    }

    async handleConfirmUpdate(data) {
        const userEmail = sessionStorage.getItem('currentUser');
        
        // Validação da senha antes de prosseguir
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            const result = this.model.updateStock(data.id, data.newStock);
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

    handleOpenEditModal(id) {
        const products = this.model.getAllProducts();
        const product = products.find(p => p.id === id);
        if (product) this.view.showEditModal(product);
    }

    async handleConfirmEdit(data) {
        const userEmail = sessionStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            const result = this.model.updateProduct(data.originalId, data);
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

        const userEmail = sessionStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid) {
            this.model.deleteProduct(data.id);
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