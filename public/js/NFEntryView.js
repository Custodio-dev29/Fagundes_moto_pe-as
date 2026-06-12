import { escapeHtml, showToast } from './utils.js';

export class NFEntryView {
    constructor() {
        this.container = document.querySelector('.content-body');
        this.entries = [];
    }

    render(entries, products) {
        this.entries = entries;
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-file-invoice-dollar"></i> Entrada de Notas Fiscais</h2>`;
        document.getElementById('header-actions-container').innerHTML = `
            <button id="btn-open-nf-modal" class="btn-primary-action"><i class="fa-solid fa-plus"></i> Nova Entrada</button>
        `;
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-list">
                    <div class="search-container">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="nfSearch" class="search-input" placeholder="Buscar por NF, fornecedor ou peça...">
                    </div>
                    <h3>Histórico de Entradas</h3>
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>NF</th>
                                <th>Produto</th>
                                <th>Fornecedor</th>
                                <th>Qtd</th>
                                <th>V. Custo</th>
                                <th>V. Venda</th>
                                <th>Margem</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="nfTableBody">
                            ${entries.length > 0 ? entries.map(n => `
                                <tr>
                                    <td>${new Date(n.date).toLocaleDateString('pt-BR')}</td>
                                    <td>${escapeHtml(n.nfNumber)}</td>
                                    <td>#${escapeHtml(n.productId)} - ${escapeHtml(n.productName)}</td>
                                    <td>${escapeHtml(n.supplierName) || '-'}</td>
                                    <td>${n.qty}</td>
                                    <td>R$ ${n.unitPrice.toFixed(2)}</td>
                                    <td>R$ ${n.sellingPrice.toFixed(2)}</td>
                                    <td>${n.profitMargin.toFixed(2)}%</td>
                                    <td>
                                        <button class="btn-action btn-edit-nf" data-id="${n.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="9" style="text-align:center">Nenhuma entrada registrada.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const datalist = document.getElementById('nfProductList');
        if (datalist) {
            datalist.innerHTML = products.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
        }
    }

    showModal(entry = null) {
        const modal = document.getElementById('nfEntryModal');
        if (!modal) return;

        const form = document.getElementById('nf-entry-form');
        form.reset();
        document.getElementById('nfEntryId').value = '';

        const modalTitle = modal.querySelector('.modal-header h3');
        const modalDesc = modal.querySelector('.modal-header p');
        const submitBtn = modal.querySelector('button[type="submit"]');
        const deleteBtn = document.getElementById('btnDeleteNFEntry');

        if (entry) {
            document.getElementById('nfEntryId').value = entry.id;
            document.getElementById('nfNum').value = entry.nfNumber;
            document.getElementById('nfProdId').value = `#${entry.productId} - ${entry.productName}`;
            document.getElementById('nfQty').value = entry.qty;
            document.getElementById('nfTotalValue').value = entry.totalValue;
            document.getElementById('nfSellingPrice').value = entry.sellingPrice;

            const unitPrice = entry.qty > 0 ? entry.totalValue / entry.qty : 0;
            document.getElementById('nfUnitPrice').value = `R$ ${unitPrice.toFixed(2)}`;
            const margin = unitPrice > 0 ? ((entry.sellingPrice - unitPrice) / unitPrice) * 100 : 0;
            document.getElementById('nfMargin').value = margin.toFixed(2) + "%";

            modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Entrada de NF';
            modalDesc.textContent = 'Altere os dados ou exclua a nota fiscal.';
            submitBtn.textContent = 'Salvar Alterações';
            if (deleteBtn) deleteBtn.style.display = '';
        } else {
            modalTitle.innerHTML = '<i class="fa-solid fa-file-circle-plus"></i> Registrar Entrada de NF';
            modalDesc.textContent = 'Insira os dados da nota para atualizar o estoque e custos.';
            submitBtn.textContent = 'Confirmar Entrada';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('nfEntryModal');
        if (modal) modal.classList.remove('active');
    }

    bindSearch() {
        const input = document.getElementById('nfSearch');
        if (!input) return;
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();

            const rows = document.querySelectorAll('#nfTableBody tr');
            
            if (!searchTerm) {
                rows.forEach(row => row.style.display = '');
                return;
            }

            const searchWords = searchTerm.split(/\s+/);
            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const isMatch = searchWords.every(word => rowText.includes(word));
                row.style.display = isMatch ? '' : 'none';
            });
        });
    }

    bindFormSubmit(addHandler, editHandler, products) {
        const form = document.getElementById('nf-entry-form');
        const prodIdInput = document.getElementById('nfProdId');
        const qtyInput = document.getElementById('nfQty');
        const totalValueInput = document.getElementById('nfTotalValue');
        const unitPriceInput = document.getElementById('nfUnitPrice');
        const sellingPriceInput = document.getElementById('nfSellingPrice');
        const marginInput = document.getElementById('nfMargin');
        const btnCancel = document.getElementById('btnCancelNF');
        const entryIdInput = document.getElementById('nfEntryId');

        if (!form) return;

        btnCancel.onclick = () => this.closeModal();

        prodIdInput.oninput = (e) => {
            const val = e.target.value.trim().toLowerCase();
            if (val.startsWith('#')) return;

            const product = products.find(p => 
                String(p.id) === val || p.name.toLowerCase().trim() === val
            );
            
            const isExactMatch = product && (String(product.id) === val || product.name.toLowerCase().trim() === val);
            if (isExactMatch) {
                e.target.value = `#${product.id} - ${product.name}`;
            }
        };

        const calculateCalculations = () => {
            const qty = parseFloat(qtyInput.value) || 0;
            const totalValue = parseFloat(totalValueInput.value) || 0;
            const sellingPrice = parseFloat(sellingPriceInput.value) || 0;

            const unitPrice = qty > 0 ? totalValue / qty : 0;
            unitPriceInput.value = `R$ ${unitPrice.toFixed(2)}`;

            const margin = unitPrice > 0 ? ((sellingPrice - unitPrice) / unitPrice) * 100 : 0;
            marginInput.value = margin.toFixed(2) + "%";
        };

        [qtyInput, totalValueInput, sellingPriceInput].forEach(el => el.oninput = calculateCalculations);

        form.onsubmit = (e) => {
            e.preventDefault();
            let val = prodIdInput.value.trim();
            if (val.startsWith('#')) {
                val = val.split(' - ')[0].replace('#', '');
            }

            const product = products.find(p => 
                String(p.id) === String(val) || p.name.toLowerCase() === val.toLowerCase()
            );

            if (!product) return showToast('Produto não encontrado. Selecione um item válido da lista.', 'warning');

            const unitPrice = parseFloat(totalValueInput.value) / parseFloat(qtyInput.value);
            const data = {
                nfNumber: document.getElementById('nfNum').value,
                productId: product.id,
                qty: parseInt(qtyInput.value),
                totalValue: parseFloat(totalValueInput.value),
                unitPrice: unitPrice,
                sellingPrice: parseFloat(sellingPriceInput.value),
                profitMargin: unitPrice > 0 ? ((parseFloat(sellingPriceInput.value) - unitPrice) / unitPrice) * 100 : 0
            };

            const entryId = entryIdInput.value;
            if (entryId) {
                editHandler(parseInt(entryId), data);
            } else {
                addHandler(data);
            }
        };
    }

    bindEditNF() {
        if (this._editBound) return;
        this._editBound = true;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-edit-nf');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            const entry = this.entries.find(n => n.id === id);
            if (entry) this.showModal(entry);
        });
    }

    bindModalDelete(handler) {
        if (this._deleteBound) return;
        this._deleteBound = true;
        document.getElementById('btnDeleteNFEntry').addEventListener('click', () => {
            const id = document.getElementById('nfEntryId').value;
            if (id) handler(parseInt(id));
        });
    }
}