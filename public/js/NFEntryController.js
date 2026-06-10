export class NFEntryController {
    constructor(model, view, inventoryModel) {
        this.model = model;
        this.view = view;
        this.inventoryModel = inventoryModel;
    }

    async showNFEntries() {
        const entries = await this.model.getAll();
        const products = await this.inventoryModel.getAllProducts();
        this.view.render(entries, products);
        this.view.bindAddNF(this.handleAddNF.bind(this), products);
        this.view.bindSearch();
    }

    async handleAddNF(data) {
        const result = await this.model.add(data);
        if (result.success) {
            this.view.closeModal();
            this.showNFEntries();
        } else {
            alert('Erro ao registrar entrada de NF.');
        }
    }
}