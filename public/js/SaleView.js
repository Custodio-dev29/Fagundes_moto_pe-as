export class SaleView {
    constructor() {
        this.container = document.querySelector('.content-body');
        this.currentCart = [];
    }

    render(customers, products) {
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-cash-register"></i> Frente de Caixa (PDV)</h2>`;
        document.getElementById('header-actions-container').innerHTML = '';
        this.currentCart = [];
        this.container.innerHTML = `
            <div class="inventory-section">
                <!-- Barra Horizontal de Inserção de Itens -->
                <div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap; border: 1px solid #ddd;">
                    <div class="form-group-inventory" style="flex: 3; min-width: 300px;">
                        <label>Produto (Código ou Nome)</label>
                        <div style="position: relative; display: flex; align-items: center;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; color: #888;"></i>
                            <input type="text" id="salePart" list="saleProductsList" placeholder="Digite para buscar..." style="background:#fff; height: 42px; padding: 0 10px 0 35px; width: 100%; border-radius: 6px; border: 1px solid #ddd; outline: none; transition: border-color 0.2s;">
                        </div>
                        <datalist id="saleProductsList">
                            ${products.map(p => `<option value="${p.id}">${p.name} | Est: ${p.stock}</option>`).join('')}
                        </datalist>
                    </div>
                    <div class="form-group-inventory" style="width: 130px;">
                        <label>Preço Unit.</label>
                        <input type="number" id="saleUnitPrice" readonly style="background: #f8f9fa; font-weight: bold;">
                    </div>
                    <div class="form-group-inventory" style="width: 100px;">
                        <label>Qtd</label>
                        <input type="number" id="saleQty" value="1" min="1">
                    </div>
                    <button type="button" id="btn-add-item-sale" class="btn-primary-action" style="height: 42px; margin-left: 0; padding: 0 25px;">
                        <i class="fa-solid fa-cart-plus"></i> ADICIONAR
                    </button>
                </div>

                <div class="pdv-container">
                    <!-- Coluna da Esquerda: Carrinho -->
                    <div class="inventory-list" style="padding: 20px; min-height: 400px; display: flex; flex-direction: column; overflow: hidden;">
                        <h3 style="margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px; flex-shrink: 0;"><i class="fa-solid fa-shopping-cart"></i> Itens no Carrinho</h3>
                        <div style="flex: 1; overflow: auto; width: 100%;">
                        <table class="inventory-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>R$ Un.</th>
                                    <th>Qtd</th>
                                    <th>Subtotal</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="saleItemsList">
                                <tr><td colspan="5" style="text-align:center; padding: 60px; color: #999;">Carrinho vazio.</td></tr>
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <!-- Coluna da Direita: Checkout -->
                    <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 20px; overflow-y: auto;">
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 2px solid #22c55e;">
                            <h3 style="margin-top:0">Total da Venda</h3>
                            <input type="text" id="saleTotal" readonly value="R$ 0,00" 
                                style="width: 100%; font-size: 38px; font-weight: bold; border: none; background: transparent; color: #15803d; text-align: right;">
                        </div>

                        <form id="sale-form" style="display: flex; flex-direction: column; gap: 15px;">
                            <div class="form-group-inventory">
                                <label>Cliente</label>
                                <div style="position: relative; display: flex; align-items: center;">
                                    <i class="fa-solid fa-user" style="position: absolute; left: 12px; color: #888;"></i>
                                    <input type="text" id="saleCustomer" list="saleCustomersList" placeholder="Busque por nome ou ID..." required style="background:#fff; height: 42px; padding: 0 10px 0 35px; width: 100%; border-radius: 6px; border: 1px solid #ddd; outline: none; transition: border-color 0.2s;">
                                </div>
                                <datalist id="saleCustomersList">
                                    ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </datalist>
                            </div>
                            <div class="form-group-inventory">
                                <label>Forma de Pagamento</label>
                                <select id="salePaymentMethod" required style="background:#fff; height: 42px; padding: 0 15px; border-radius: 6px; border: 1px solid #ddd;">
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="PIX">PIX</option>
                                    <option value="Cartão de Débito">Cartão de Débito</option>
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                </select>
                            </div>
                            <button type="submit" class="btn-submit-inventory" style="width: 100%; margin-top: 10px; padding: 18px; font-size: 20px; background: #15803d;">
                                <i class="fa-solid fa-check-double"></i> FINALIZAR VENDA
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Foca automaticamente no campo de busca após a renderização
        setTimeout(() => {
            const searchInput = document.getElementById('salePart');
            if (searchInput) searchInput.focus();
        }, 50);
    }

    renderCart() {
        const tbody = document.getElementById('saleItemsList');
        const totalInput = document.getElementById('saleTotal');
        if (!tbody) return;

        if (this.currentCart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 60px; color: #999;">Carrinho vazio.</td></tr>';
        } else {
            tbody.innerHTML = this.currentCart.map((item, index) => `
                <tr>
                    <td style="text-align: left;">${item.productName}</td>
                    <td>R$ ${item.unitPrice.toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td style="font-weight: bold;">R$ ${item.subtotal.toFixed(2)}</td>
                    <td>
                        <button type="button" class="btn-delete" data-index="${index}" style="color: #ef4444;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        const total = this.currentCart.reduce((sum, item) => sum + item.subtotal, 0);
        totalInput.value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
        totalInput.dataset.value = total; // Guarda o valor numérico para o form
    }

    bindAddSale(handler, products, customers) {
        const form = document.getElementById('sale-form');
        const partSelect = document.getElementById('salePart');
        const customerInput = document.getElementById('saleCustomer');
        const qtyInput = document.getElementById('saleQty');
        const unitPriceInput = document.getElementById('saleUnitPrice');
        const btnAddItem = document.getElementById('btn-add-item-sale');
        const cartTable = document.getElementById('saleItemsList');

        if (!form) return;

        partSelect.oninput = (e) => {
            const val = e.target.value.trim().toLowerCase();
            if (val.startsWith('#')) return; // Já está formatado

            const product = products.find(p => 
                String(p.id) === val || p.name.toLowerCase().trim() === val
            );

            if (product) {
                unitPriceInput.value = product.sellingPrice || 0;
                
                // Se houver match exato por ID ou Nome, formata o campo para exibir o "preview"
                const isExactMatch = String(product.id) === val || product.name.toLowerCase().trim() === val;
                if (isExactMatch) {
                    e.target.value = `#${product.id} - ${product.name}`;
                }
            } else {
                unitPriceInput.value = '';
            }
        };

        customerInput.oninput = (e) => {
            const val = e.target.value.trim().toLowerCase();
            if (val.startsWith('#')) return; // Já está formatado

            const customer = customers.find(c => 
                String(c.id) === val || c.name.toLowerCase().trim() === val
            );

            // Formata o campo de cliente ao encontrar match
            const isExactMatch = customer && (String(customer.id) === val || customer.name.toLowerCase().trim() === val);
            if (isExactMatch) {
                e.target.value = `#${customer.id} - ${customer.name}`;
            }
        };

        btnAddItem.onclick = () => {
            let val = partSelect.value.trim();
            // Se estiver no formato formatado, extrai apenas o ID numérico
            if (val.startsWith('#')) {
                val = val.split(' - ')[0].replace('#', '');
            }

            const qty = parseInt(qtyInput.value);
            const product = products.find(p => 
                String(p.id) === String(val) || p.name.toLowerCase() === val.toLowerCase()
            );

            if (!product || qty <= 0) return alert('Selecione um produto e quantidade válida.');
            
            // Validação básica de estoque antes de colocar no carrinho
            if (product.stock < qty) {
                return alert(`Estoque insuficiente! Disponível: ${product.stock}`);
            }
            
            this.currentCart.push({
                productId: product.id,
                productName: product.name,
                qty: qty,
                unitPrice: product.sellingPrice || 0,
                subtotal: (product.sellingPrice || 0) * qty
            });

            this.renderCart();
            qtyInput.value = 1;
            partSelect.value = '';
            unitPriceInput.value = '';
            partSelect.focus();
        };

        cartTable.onclick = (e) => {
            const btn = e.target.closest('.btn-delete');
            if (btn) {
                this.currentCart.splice(btn.dataset.index, 1);
                this.renderCart();
            }
        };

        form.onsubmit = (e) => {
            e.preventDefault();
            if (this.currentCart.length === 0) return alert('Adicione pelo menos um item à venda.');

            let custVal = customerInput.value.trim();
            if (custVal.startsWith('#')) {
                custVal = custVal.split(' - ')[0].replace('#', '');
            }

            const customer = customers.find(c => 
                String(c.id) === custVal || c.name.toLowerCase() === custVal.toLowerCase()
            );

            if (!customer) return alert('Selecione um cliente válido.');

            handler({
                customerId: customer.id,
                items: this.currentCart,
                paymentMethod: document.getElementById('salePaymentMethod').value,
                total: parseFloat(document.getElementById('saleTotal').dataset.value)
            });
        };
    }
}