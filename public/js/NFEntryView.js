export class NFEntryView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    render(entries, products) {
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
                            </tr>
                        </thead>
                        <tbody id="nfTableBody">
                            ${entries.length > 0 ? entries.map(n => `
                                <tr>
                                    <td>${new Date(n.date).toLocaleDateString('pt-BR')}</td>
                                    <td>${n.nfNumber}</td>
                                    <td>#${n.productId} - ${n.productName}</td>
                                    <td>${n.supplierName || '-'}</td>
                                    <td>${n.qty}</td>
                                    <td>R$ ${n.unitPrice.toFixed(2)}</td>
                                    <td>R$ ${n.sellingPrice.toFixed(2)}</td>
                                    <td>${n.profitMargin.toFixed(2)}%</td>
                                </tr>
                            `).join('') : '<tr><td colspan="8" style="text-align:center">Nenhuma entrada registrada.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Preenche o datalist para o autocomplete do código
        const datalist = document.getElementById('nfProductList');
        if (datalist) {
            datalist.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
    }

    showModal() {
        const modal = document.getElementById('nfEntryModal');
        if (modal) {
            document.getElementById('nf-entry-form').reset();
            modal.classList.add('active');
        }
    }

    closeModal() {
        const modal = document.getElementById('nfEntryModal');
        if (modal) modal.classList.remove('active');
    }

    bindSearch() {
        const input = document.getElementById('nfSearch');
        if (!input) return;
        input.addEventListener('input', (e) => {
            // Normaliza o termo de busca: minúsculas, remove acentos e espaços extras
            const searchTerm = e.target.value.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();

            const rows = document.querySelectorAll('#nfTableBody tr');
            
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

    bindAddNF(handler, products) {
        const form = document.getElementById('nf-entry-form');
        const prodIdInput = document.getElementById('nfProdId');
        const qtyInput = document.getElementById('nfQty');
        const totalValueInput = document.getElementById('nfTotalValue');
        const unitPriceInput = document.getElementById('nfUnitPrice');
        const sellingPriceInput = document.getElementById('nfSellingPrice');
        const marginInput = document.getElementById('nfMargin');
        const btnCancel = document.getElementById('btnCancelNF');

        if (!form) return;

        btnCancel.onclick = () => this.closeModal();

        prodIdInput.oninput = (e) => {
            const val = e.target.value.trim().toLowerCase();
            if (val.startsWith('#')) return;

            const product = products.find(p => 
                String(p.id) === val || p.name.toLowerCase().trim() === val
            );
            
            // Ao encontrar o produto, formata o campo no estilo #ID - Nome
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

            if (!product) return alert('Produto não encontrado. Selecione um item válido da lista.');

            const unitPrice = parseFloat(totalValueInput.value) / parseFloat(qtyInput.value);
            handler({
                nfNumber: document.getElementById('nfNum').value,
                productId: product.id,
                qty: parseInt(qtyInput.value),
                totalValue: parseFloat(totalValueInput.value),
                unitPrice: unitPrice,
                sellingPrice: parseFloat(sellingPriceInput.value),
                profitMargin: unitPrice > 0 ? ((parseFloat(sellingPriceInput.value) - unitPrice) / unitPrice) * 100 : 0
            });
        };
    }
}