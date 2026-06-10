export class DashboardView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    render(data) {
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-gauge"></i> Painel de Controle</h2>`;
        document.getElementById('header-actions-container').innerHTML = '';

        this.container.innerHTML = `
            <div class="dashboard-wrapper">
                <div class="stats-row">
                    <div class="stat-card">
                        <i class="fa-solid fa-money-bill-trend-up"></i>
                        <div>
                            <h3>Vendas Hoje</h3>
                            <div class="value">R$ ${parseFloat(data.totalSalesToday).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="stat-card ${data.lowStockCount > 0 ? 'warning' : ''}">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <div>
                            <h3>Estoque Crítico</h3>
                            <div class="value">${data.lowStockCount} Itens</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-content-row">
                    <div class="dashboard-box half-width">
                        <h3 style="margin-top:0; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                            <i class="fa-solid fa-calendar-day"></i> Vendas Realizadas Hoje
                        </h3>
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table class="inventory-table" style="min-width: 100%;">
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Cliente</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.todaySales.length === 0 ? 
                                        '<tr><td colspan="3" style="padding: 30px; color: #999;">Nenhuma venda registrada hoje.</td></tr>' : 
                                        data.todaySales.map(s => `
                                            <tr>
                                                <td>${new Date(s.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                                                <td>${s.customerName || 'Consumidor Final'}</td>
                                                <td style="font-weight:bold; color:#059c0d">R$ ${parseFloat(s.total).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}