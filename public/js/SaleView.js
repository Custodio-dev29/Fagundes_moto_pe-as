export class SaleView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    render(sales, customers, products) {
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2><i class="fa-solid fa-cart-shopping"></i> Gerenciamento de Vendas</h2>
                        <p>Visualize o histórico de vendas e registre novas transações.</p>
                    </div>
                    <button id="btn-open-sale-modal" class="btn-primary-action" style="margin-left: 0;">
                        <i class="fa-solid fa-cart-plus"></i> Nova Venda
                    </button>
                </div>

                <div class="inventory-list" style="margin-top: 30px;">
                    <h3>Histórico de Vendas</h3>
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Código</th>
                                <th>Cliente</th>
                                <th>Produto</th>
                                <th>Qtd</th>
                                <th>Pagamento</th>
                                <th>Total</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="salesTableBody">
                            ${sales.length > 0 ? [...sales].reverse().map(s => {
                                // Prioriza os nomes salvos no histórico da venda para preservar dados de cadastros excluídos
                                const customerName = s.customerName || (customers.find(c => String(c.id) === String(s.customerId))?.name) || '<em>Excluído</em>';
                                const productName = s.productName || (products.find(p => String(p.id) === String(s.productId))?.name) || '<em>Excluído</em>';
                                return `
                                    <tr>
                                        <td>${new Date(s.date).toLocaleDateString('pt-BR')}</td>
                                        <td>${s.productId}</td>
                                        <td>${customerName}</td>
                                        <td>${productName}</td>
                                        <td>${s.qty}</td>
                                        <td>${s.paymentMethod || '-'}</td>
                                        <td>R$ ${parseFloat(s.total).toFixed(2)}</td>
                                        <td>
                                            <button class="btn-edit-action" data-id="${s.id}" title="Editar venda">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : '<tr><td colspan="8" style="text-align:center">Nenhuma venda registrada.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    showRegisterModal(customers, products) {
        const modal = document.getElementById('saleModal');
        const custSelect = document.getElementById('saleCustomer');
        const partSelect = document.getElementById('salePart');

        if (!modal || !custSelect || !partSelect) return;

        custSelect.innerHTML = '<option value="">Selecione um cliente...</option>' + 
            customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        partSelect.innerHTML = '<option value="">Selecione uma peça...</option>' + 
            products.map(p => `<option value="${p.id}">#${p.id} - ${p.name} (Estoque: ${p.stock})</option>`).join('');

        document.getElementById('sale-form').reset();
        document.getElementById('saleTotal').value = 'R$ 0,00';
        modal.classList.add('active');
    }

    closeRegisterModal() {
        const modal = document.getElementById('saleModal');
        if (modal) modal.classList.remove('active');
    }

    showEditModal(sale, customers, products) {
        const modal = document.getElementById('editSaleModal');
        const custSelect = document.getElementById('editSaleCustomer');
        const partSelect = document.getElementById('editSalePart');
        if (!modal) return;

        custSelect.innerHTML = customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        partSelect.innerHTML = products.map(p => `<option value="${p.id}">#${p.id} - ${p.name}</option>`).join('');

        document.getElementById('editSaleId').value = sale.id;
        custSelect.value = sale.customerId;
        partSelect.value = sale.productId;
        document.getElementById('editSaleQty').value = sale.qty;
        document.getElementById('editSalePaymentMethod').value = sale.paymentMethod;
        document.getElementById('editSaleTotal').value = `R$ ${parseFloat(sale.total).toFixed(2)}`;
        document.getElementById('editSalePassword').value = '';

        // Lógica de cálculo no edit
        const updateEditTotal = () => {
            const product = products.find(p => String(p.id) === String(partSelect.value));
            const qty = parseInt(document.getElementById('editSaleQty').value) || 0;
            const price = product ? product.price : 0;
            document.getElementById('editSaleTotal').value = `R$ ${(qty * price).toFixed(2)}`;
        };

        partSelect.onchange = updateEditTotal;
        document.getElementById('editSaleQty').oninput = updateEditTotal;

        modal.classList.add('active');
    }

    closeEditModal() {
        const modal = document.getElementById('editSaleModal');
        if (modal) modal.classList.remove('active');
    }

    bindAddSale(handler, products) {
        const form = document.getElementById('sale-form');
        const partSelect = document.getElementById('salePart');
        const qtyInput = document.getElementById('saleQty');
        const unitPriceInput = document.getElementById('saleUnitPrice');
        const totalInput = document.getElementById('saleTotal');
        const btnCancel = document.getElementById('btnCancelSale');

        if (!form) return;

        btnCancel.onclick = () => this.closeRegisterModal();

        const calculateTotal = () => {
            const qty = parseInt(qtyInput.value) || 0;
            const price = parseFloat(unitPriceInput.value) || 0;
            totalInput.value = `R$ ${(qty * price).toFixed(2)}`;
        };

        partSelect.onchange = (e) => {
            const product = products.find(p => String(p.id) === String(e.target.value));
            unitPriceInput.value = product ? product.price : '';
            calculateTotal();
        };

        qtyInput.oninput = calculateTotal;

        form.onsubmit = (e) => {
            e.preventDefault();
            handler({
                customerId: document.getElementById('saleCustomer').value,
                productId: partSelect.value,
                qty: parseInt(qtyInput.value),
                paymentMethod: document.getElementById('salePaymentMethod').value,
                total: parseFloat(unitPriceInput.value) * parseInt(qtyInput.value)
            });
        };
    }

    bindEditAction(onOpenModal) {
        const tableBody = document.getElementById('salesTableBody');
        if (!tableBody) return;
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-edit-action');
            if (btn) onOpenModal(btn.dataset.id);
        });
    }

    bindConfirmEdit(onUpdate, onDelete, products) {
        const form = document.getElementById('editSaleForm');
        const btnDelete = document.getElementById('btnDeleteSale');
        const btnCancel = document.getElementById('btnCancelEditSale');
        if (!form) return;

        btnCancel.onclick = () => this.closeEditModal();

        btnDelete.onclick = () => onDelete({
            id: document.getElementById('editSaleId').value,
            password: document.getElementById('editSalePassword').value
        });

        form.onsubmit = (e) => {
            e.preventDefault();
            const productId = document.getElementById('editSalePart').value;
            const product = products.find(p => String(p.id) === String(productId));
            const qty = parseInt(document.getElementById('editSaleQty').value);
            
            onUpdate({
                id: document.getElementById('editSaleId').value,
                customerId: document.getElementById('editSaleCustomer').value,
                productId: productId,
                qty: qty,
                paymentMethod: document.getElementById('editSalePaymentMethod').value,
                total: (product ? product.price : 0) * qty,
                password: document.getElementById('editSalePassword').value
            });
        };
    }
}