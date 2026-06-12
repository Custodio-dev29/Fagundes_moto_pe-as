import { escapeHtml } from './utils.js';

export class InventoryView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    renderForm(products) {
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-plus-circle"></i> Cadastro de Peças</h2>`;
        document.getElementById('header-actions-container').innerHTML = `
            <button id="btn-open-register-modal" class="btn-primary-action"><i class="fa-solid fa-plus"></i> Novo Item</button>
        `;
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-list">
                    <div class="search-container">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="inventorySearch" class="search-input" placeholder="Buscar por nome ou código...">
                    </div>
                    <h3>Peças Cadastradas Recentemente</h3>
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Produto</th>
                                <th>Fornecedor</th>
                                <th>Estoque</th>
                                <th>E. Mín</th>
                                <th>E. Máx</th>
                                <th>Preço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            ${products.length === 0 ? '<tr><td colspan="8" style="text-align:center">Nenhum produto cadastrado.</td></tr>' : 
                            products.map(p => {
                                const stock = p.stock || 0;
                                const minStock = p.minStock || 0;
                                return `
                                    <tr>
                                        <td><strong>${escapeHtml(p.id)}</strong></td>
                                        <td>${escapeHtml(p.name)}</td>
                                        <td>${escapeHtml(p.supplier) || '-'}</td>
                                        <td style="color: ${stock < minStock ? 'white' : 'inherit'}; background-color: ${stock < minStock ? '#dd4c62' : 'inherit'};">${stock}</td>
                                        <td>${minStock}</td>
                                        <td>${escapeHtml(p.maxStock) || '-'}</td>
                                        <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.sellingPrice || 0)}</td>
                                        <td>
                                            <button class="btn-edit-action" data-id="${escapeHtml(p.id)}" title="Editar item">
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
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-boxes-stacked"></i> Estoque de Peças</h2>`;
        document.getElementById('header-actions-container').innerHTML = '';
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-list">
                    <div class="search-container">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="inventorySearch" class="search-input" placeholder="Buscar por nome ou código...">
                    </div>
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Produto</th>
                                <th>Fornecedor</th>
                                <th>Estoque</th>
                                <th>Preço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            ${products.length === 0 ? '<tr><td colspan="6" style="text-align:center">Nenhum produto cadastrado.</td></tr>' : 
                            products.map(p => {
                                const stock = p.stock || 0;
                                const minStock = p.minStock || 0;
                                return `
                                    <tr>
                                        <td><strong>${escapeHtml(p.id)}</strong></td>
                                        <td>${escapeHtml(p.name)}</td>
                                        <td>${escapeHtml(p.supplier) || '-'}</td>
                                        <td style="color: ${stock < minStock ? 'white' : 'inherit'}; background-color: ${stock < minStock ? '#dd4c62' : 'inherit'};">${stock}</td>
                                        <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.sellingPrice || 0)}</td>
                                        <td>
                                            <button class="btn-edit-action" data-id="${escapeHtml(p.id)}" title="Editar item">
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

    bindSearch() {
        const input = document.getElementById('inventorySearch');
        if (!input) return;
        input.addEventListener('input', (e) => {
            // Normaliza o termo de busca: minúsculas, remove acentos e espaços extras
            const searchTerm = e.target.value.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();

            const rows = document.querySelectorAll('#inventoryTableBody tr');
            
            if (!searchTerm) {
                rows.forEach(row => row.style.display = '');
                return;
            }

            const searchWords = searchTerm.split(/\s+/); // Divide por espaços
            rows.forEach(row => {
                // Normaliza o texto da linha para comparação
                const rowText = row.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                // Verifica se TODAS as palavras da busca estão presentes na linha
                const isMatch = searchWords.every(word => rowText.includes(word));
                row.style.display = isMatch ? '' : 'none';
            });
        });
    }

    bindAddProduct(handler) {
        const form = document.getElementById('registerProductForm');
        const btnCancel = document.getElementById('btnCancelRegister');
        if (!form || !btnCancel) return;

        btnCancel.addEventListener('click', () => this.closeRegisterModal());

        form.addEventListener('submit', e => {
            e.preventDefault();
            const data = {
                id: parseInt(document.getElementById('regProdId').value),
                name: document.getElementById('regProdName').value,
                supplier: document.getElementById('regProdSupplier').value,
                stock: 0,
                minStock: parseInt(document.getElementById('regProdMinStock').value) || 0,
                maxStock: parseInt(document.getElementById('regProdMaxStock').value) || 0
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
        const prodId = product.id;
        document.getElementById('editProdIdOriginal').value = prodId;
        document.getElementById('editProdId').value = prodId;
        document.getElementById('editProdName').value = product.name;
        document.getElementById('editProdSupplier').value = product.supplier || '';
        document.getElementById('editProdStock').value = product.stock || 0;
        document.getElementById('editProdMinStock').value = product.minStock || 0;
        document.getElementById('editProdMaxStock').value = product.maxStock || 0;
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
        
        btnDelete.onclick = () => onDelete(
            parseInt(document.getElementById('editProdIdOriginal').value)
        );

        form.onsubmit = (e) => {
            e.preventDefault();
            onUpdate({
                originalId: document.getElementById('editProdIdOriginal').value,
                id: parseInt(document.getElementById('editProdId').value),
                name: document.getElementById('editProdName').value,
                supplier: document.getElementById('editProdSupplier').value,
                stock: parseInt(document.getElementById('editProdStock').value) || 0,
                minStock: parseInt(document.getElementById('editProdMinStock').value) || 0,
                maxStock: parseInt(document.getElementById('editProdMaxStock').value) || 0
            });
        };
    }
}