export class InventoryView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    renderForm(products) {
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2><i class="fa-solid fa-plus-circle"></i> Cadastro de Peças</h2>
                        <p>Gerencie as peças recém-adicionadas ao sistema.</p>
                    </div>
                    <button id="btn-open-register-modal" class="btn-primary-action" style="margin-left: 0;">
                        <i class="fa-solid fa-plus"></i> Novo Item
                    </button>
                </div>
                <div class="inventory-list" style="margin-top: 30px;">
                    <h3>Peças Cadastradas Recentemente</h3>
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Nº Cadastro</th>
                                <th>Produto</th>
                                <th>V. Compra</th>
                                <th>Valor de Venda</th>
                                <th>Margem (%)</th>
                                <th>Qtd em Estoque</th>
                                <th>E. Mín</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            ${products.length === 0 ? '<tr><td colspan="8" style="text-align:center">Nenhum produto cadastrado.</td></tr>' : 
                            products.map(p => {
                                const purchasePrice = p.purchasePrice || 0;
                                const price = p.price || 0;
                                const stock = p.stock || 0;
                                const minStock = p.minStock || 0;
                                const margin = purchasePrice > 0 ? (((price - purchasePrice) / purchasePrice) * 100).toFixed(2) : "0.00";
                                return `
                                    <tr>
                                        <td><strong>${p.id}</strong></td>
                                        <td>${p.name}</td>
                                        <td>R$ ${purchasePrice.toFixed(2)}</td>
                                        <td>R$ ${price.toFixed(2)}</td>
                                        <td>${margin}%</td>
                                        <td> ${stock <= minStock ? 'low' : ''}${stock}</td>
                                        <td>${minStock}</td>
                                        <td>
                                            <button class="btn-edit-action" data-id="${p.id}" title="Editar item">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderTable(products) {
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-header">
                    <h2><i class="fa-solid fa-boxes-stacked"></i> Estoque de Peças</h2>
                    <p>Lista de produtos cadastrados no sistema.</p>
                </div>
                <div class="inventory-list">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Nº Cadastro</th>
                                <th>Produto</th>
                                <th>Valor de Venda</th>
                                <th>Qtd em Estoque</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            ${products.length === 0 ? '<tr><td colspan="8" style="text-align:center">Nenhum produto cadastrado.</td></tr>' : 
                            products.map(p => {
                                const purchasePrice = p.purchasePrice || 0;
                                const price = p.price || 0;
                                const stock = p.stock || 0;
                                const minStock = p.minStock || 0;
                                const margin = purchasePrice > 0 ? (((price - purchasePrice) / purchasePrice) * 100).toFixed(2) : "0.00";
                                return `
                                    <tr>
                                        <td><strong>${p.id}</strong></td>
                                        <td>${p.name}</td>
                                        <td>R$ ${price.toFixed(2)}</td>
                                        <td>${stock <= minStock ? 'low' : ''}${stock}</td>
                                        <td>
                                            <button class="btn-edit-action" data-id="${p.id}" title="Editar item">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    bindAddProduct(handler) {
        const form = document.getElementById('registerProductForm');
        const btnCancel = document.getElementById('btnCancelRegister');
        if (!form || !btnCancel) return;

        const purchaseInput = document.getElementById('regProdPurchasePrice');
        const saleInput = document.getElementById('regProdPrice');
        const marginInput = document.getElementById('regProdMargin');

        const updateMargin = () => {
            const buy = parseFloat(purchaseInput.value) || 0;
            const sell = parseFloat(saleInput.value) || 0;
            const margin = buy > 0 ? (((sell - buy) / buy) * 100).toFixed(2) : "0.00";
            marginInput.value = margin + "%";
        };

        purchaseInput.addEventListener('input', updateMargin);
        saleInput.addEventListener('input', updateMargin);

        btnCancel.addEventListener('click', () => this.closeRegisterModal());

        form.addEventListener('submit', e => {
            e.preventDefault();
            const data = {
                id: document.getElementById('regProdId').value,
                name: document.getElementById('regProdName').value,
                purchasePrice: document.getElementById('regProdPurchasePrice').value,
                price: document.getElementById('regProdPrice').value,
                stock: document.getElementById('regProdStock').value,
                minStock: document.getElementById('regProdMinStock').value
            };
            handler(data);
        });
    }

    showRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            document.getElementById('registerProductForm').reset();
            modal.classList.add('active');
        }
    }

    closeRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) modal.classList.remove('active');
    }

    bindUpdateStock(onOpenModal) {
        const table = document.getElementById('inventoryTableBody');
        if (!table) return;
        table.addEventListener('click', e => {
            const btn = e.target.closest('.stock-badge-btn');
            if (btn) onOpenModal(btn.dataset.id, btn.innerText);
        });
    }

    showModal(id, currentStock) {
        const modal = document.getElementById('stockModal');
        if (!modal) return;
        document.getElementById('modalProdId').value = id;
        document.getElementById('modalNewStock').value = currentStock;
        document.getElementById('modalPassword').value = '';
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('stockModal');
        if (modal) modal.classList.remove('active');
    }

    bindConfirmUpdate(handler) {
        const form = document.getElementById('modalForm');
        const btnCancel = document.getElementById('btnCancelModal');
        if (!form || !btnCancel) return;

        btnCancel.addEventListener('click', () => this.closeModal());
        form.addEventListener('submit', e => {
            e.preventDefault();
            handler({
                id: document.getElementById('modalProdId').value,
                newStock: document.getElementById('modalNewStock').value,
                password: document.getElementById('modalPassword').value
            });
        });
    }

    bindEditAction(onOpenModal) {
        const table = document.getElementById('inventoryTableBody');
        if (!table) return;
        table.addEventListener('click', e => {
            const btn = e.target.closest('.btn-edit-action');
            if (btn) onOpenModal(btn.dataset.id);
        });
    }

    showEditModal(product) {
        const modal = document.getElementById('editProductModal');
        document.getElementById('editProdIdOriginal').value = product.id;
        document.getElementById('editProdId').value = product.id;
        document.getElementById('editProdName').value = product.name;
        const purchasePrice = product.purchasePrice || 0;
        const price = product.price || 0;
        document.getElementById('editProdPurchasePrice').value = purchasePrice;
        document.getElementById('editProdPrice').value = price;
        document.getElementById('editProdStock').value = product.stock || 0;
        document.getElementById('editProdMinStock').value = product.minStock || 0;
        
        const marginInput = document.getElementById('editProdMargin');
        const updateEditMargin = () => {
            const buy = parseFloat(document.getElementById('editProdPurchasePrice').value) || 0;
            const sell = parseFloat(document.getElementById('editProdPrice').value) || 0;
            marginInput.value = (buy > 0 ? (((sell - buy) / buy) * 100).toFixed(2) : "0.00") + "%";
        };

        document.getElementById('editProdPurchasePrice').oninput = updateEditMargin;
        document.getElementById('editProdPrice').oninput = updateEditMargin;

        const margin = purchasePrice > 0 ? (((price - purchasePrice) / purchasePrice) * 100).toFixed(2) : "0.00";
        document.getElementById('editProdMargin').value = margin + "%";
        document.getElementById('editProdPassword').value = '';
        modal.classList.add('active');
    }

    closeEditModal() {
        document.getElementById('editProductModal').classList.remove('active');
    }

    bindConfirmEdit(onUpdate, onDelete) {
        const form = document.getElementById('editProductForm');
        const btnDelete = document.getElementById('btnDeleteProduct');
        const btnCancel = document.getElementById('btnCancelEdit');

        btnCancel.onclick = () => this.closeEditModal();
        
        btnDelete.onclick = () => onDelete({
            id: document.getElementById('editProdIdOriginal').value,
            password: document.getElementById('editProdPassword').value
        });

        form.onsubmit = (e) => {
            e.preventDefault();
            onUpdate({
                originalId: document.getElementById('editProdIdOriginal').value,
                id: document.getElementById('editProdId').value,
                name: document.getElementById('editProdName').value,
                purchasePrice: document.getElementById('editProdPurchasePrice').value,
                price: document.getElementById('editProdPrice').value,
                stock: document.getElementById('editProdStock').value,
                minStock: document.getElementById('editProdMinStock').value,
                password: document.getElementById('editProdPassword').value
            });
        };
    }
}