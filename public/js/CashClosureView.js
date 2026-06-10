export class CashClosureView {
    constructor() {
        this.container = document.querySelector('.content-body');
        this.chart = null;
    }

    render(data = [], topProducts = [], startDate = '', endDate = '') {
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-vault"></i> Fechamento de Caixa</h2>`;
        document.getElementById('header-actions-container').innerHTML = '';

        const totalGeral = data.reduce((sum, item) => sum + item.total, 0);
        const totalVendas = data.reduce((sum, item) => sum + (item.count || 0), 0);

        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-list" style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                        <div class="form-group-inventory">
                            <label>Data Início</label>
                            <input type="date" id="closureStart" value="${startDate}">
                        </div>
                        <div class="form-group-inventory">
                            <label>Data Fim</label>
                            <input type="date" id="closureEnd" value="${endDate}">
                        </div>
                        <button id="btnFilterClosure" class="btn-primary-action">
                            <i class="fa-solid fa-filter"></i> FILTRAR PERÍODO
                        </button>
                        <button id="btnClearClosure" class="btn-secondary" style="height: 42px; width: auto; padding: 0 20px; background: #666;">
                            <i class="fa-solid fa-rotate-left"></i> HOJE
                        </button>
                    </div>
                </div>

                <!-- Cards de Resumo no Topo -->
                <div class="stats-row" style="margin-bottom: 25px;">
                    <div class="stat-card" style="max-width: 300px;">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                        <div>
                            <h3>Valor Total</h3>
                            <div class="value" style="color: #15803d;">R$ ${totalGeral.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="stat-card" style="max-width: 300px; border-left-color: #0288d1;">
                        <i class="fa-solid fa-receipt" style="color: #0288d1;"></i>
                        <div>
                            <h3>Qtd. Vendas</h3>
                            <div class="value" style="color: #0288d1;">${totalVendas}</div>
                        </div>
                    </div>
                </div>

                <!-- Corpo do Fechamento: Tabela e Gráfico -->
                <div class="report-container">
                    <div class="inventory-list">
                        <h3 style="margin-top:0"><i class="fa-solid fa-file-invoice-dollar"></i> Resumo Financeiro</h3>
                        <table class="inventory-table" style="min-width: 100%;">
                            <thead>
                                <tr>
                                    <th style="text-align: left;">Forma de Pagamento</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.length === 0 ? '<tr><td colspan="2" style="text-align:center; padding: 20px;">Sem vendas.</td></tr>' : 
                                data.map(item => `
                                    <tr>
                                        <td style="text-align: left;">${item.paymentMethod}</td>
                                        <td style="text-align: right; font-weight: bold;">R$ ${item.total.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background: #f0fdf4; font-size: 1rem;">
                                    <td style="text-align: left; font-weight: bold; color: #15803d;">TOTAL GERAL</td>
                                    <td style="text-align: right; font-weight: bold; color: #15803d;">R$ ${totalGeral.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div class="inventory-list">
                        <h3 style="margin-top:0"><i class="fa-solid fa-chart-bar"></i> Peças Mais Vendidas</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="topProductsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderChart(topProducts);
    }

    renderChart(products) {
        const canvas = document.getElementById('topProductsChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: products.length > 0 ? products.map(p => p.name.substring(0, 15) + (p.name.length > 15 ? '...' : '')) : ['Sem dados'],
                datasets: [{
                    label: 'Quantidade Vendida',
                    data: products.length > 0 ? products.map(p => p.totalQty) : [0],
                    backgroundColor: '#059c0d',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } }
            }
        });
    }

    bindFilter(handler) {
        const btnFilter = document.getElementById('btnFilterClosure');
        const btnClear = document.getElementById('btnClearClosure');

        if (btnFilter) {
            btnFilter.onclick = () => {
                handler(document.getElementById('closureStart').value, document.getElementById('closureEnd').value);
            };
        }

        if (btnClear) {
            btnClear.onclick = () => handler('', '');
        }
    }
}