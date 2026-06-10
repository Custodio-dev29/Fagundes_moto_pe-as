export class SaleHistoryView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    render(sales) {
        // Agrupa as vendas por cliente para criar seções separadas
        const groupedSales = sales.reduce((acc, sale) => {
            const customer = sale.customerName || 'Cliente Excluído';
            if (!acc[customer]) acc[customer] = [];
            acc[customer].push(sale);
            return acc;
        }, {});

        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-clock-rotate-left"></i> Histórico de Vendas</h2>`;
        document.getElementById('header-actions-container').innerHTML = '';

        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-list">
                    ${Object.keys(groupedSales).length === 0 ? 
                        '<p style="text-align:center; padding: 40px; color: #999;">Nenhuma venda encontrada.</p>' :
                        Object.entries(groupedSales).map(([customer, cSales]) => `
                            <div class="customer-group" style="margin-bottom: 15px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                                <h3 class="customer-toggle" style="background: #f8f9fa; padding: 15px; margin: 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid var(--sidebar-bg); transition: background 0.3s;">
                                    <span><i class="fa-solid fa-user"></i> ${customer} <small style="margin-left: 10px; color: #666; font-weight: normal;">(${cSales.length} vendas)</small></span>
                                    <i class="fa-solid fa-chevron-down toggle-icon" style="transition: transform 0.3s;"></i>
                                </h3>
                                <div class="sale-items-container" style="display: none; padding: 15px; background: #fff; border-top: 1px solid #eee; overflow-x: auto;">
                                <table class="inventory-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 150px;">Data/Hora</th>
                                            <th style="text-align: left;">Itens da Compra</th>
                                            <th style="width: 120px;">Pagamento</th>
                                            <th style="width: 120px;">Total</th>
                                            <th style="width: 80px;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${cSales.map(s => `
                                            <tr>
                                                <td>${new Date(s.date).toLocaleDateString('pt-BR')}<br><small>${new Date(s.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</small></td>
                                                <td style="text-align:left; font-size: 13px; line-height: 1.6; padding: 12px;">
                                                    ${s.productName ? s.productName.split(', ').map(item => `<div style="margin-bottom: 2px;">• ${item}</div>`).join('') : '<em>Sem itens</em>'}
                                                </td>
                                                <td><span style="font-size: 11px; background: #eee; padding: 2px 6px; border-radius: 4px;">${s.paymentMethod}</span></td>
                                                <td style="font-weight:bold; color: #15803d;">R$ ${parseFloat(s.total).toFixed(2)}</td>
                                                <td>
                                                    <button class="btn-edit-action" data-id="${s.id}" title="Cancelar Venda" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 18px;">
                                                        <i class="fa-solid fa-circle-xmark"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }

    bindEditAction(onOpenModal) {
        // Usamos delegação de evento no container principal para suportar múltiplas tabelas
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-edit-action');
            if (btn) onOpenModal(btn.dataset.id);

            // Lógica de abrir/fechar o grupo de clientes (Acordeão)
            const header = e.target.closest('.customer-toggle');
            if (header) {
                const container = header.nextElementSibling;
                const icon = header.querySelector('.toggle-icon');
                const isVisible = container.style.display === 'block';
                
                container.style.display = isVisible ? 'none' : 'block';
                icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
                header.style.background = isVisible ? '#f8f9fa' : '#f1f1f1';
            }
        });
    }
}