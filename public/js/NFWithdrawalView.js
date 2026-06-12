import { escapeHtml, showToast } from './utils.js';

export class NFWithdrawalView {
    constructor() {
        this.container = document.querySelector('.content-body');
        this.withdrawals = [];
    }

    render(withdrawals) {
        this.withdrawals = withdrawals;
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-file-export"></i> Retirada de NF</h2>`;
        document.getElementById('header-actions-container').innerHTML = `
            <button id="btn-open-nf-withdrawal-modal" class="btn-primary-action"><i class="fa-solid fa-plus"></i> Nova Retirada</button>
        `;
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-list">
                    <div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap;align-items:flex-end">
                        <div style="display:flex;gap:30px;align-items:end;flex-wrap:wrap">
                            <div class="form-group-inventory" style="width:160px">
                                <label>Data Início</label>
                                <input type="date" id="nfwFilterStart" class="search-input">
                            </div>
                            <div class="form-group-inventory" style="width:160px">
                                <label>Data Fim</label>
                                <input type="date" id="nfwFilterEnd" class="search-input">
                            </div>
                            <button id="btnNfwFilter" class="btn-primary-action" style="height:38px;padding:0 15px"><i class="fa-solid fa-filter"></i> Filtrar</button>
                            <button id="btnNfwClearFilter" class="btn-secondary" style="height:38px;padding:0 15px;width:auto;background:#666">Limpar</button>
                        </div>
                        <div class="search-container" style="margin-bottom:0">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="nfWithdrawalSearch" class="search-input" placeholder="Buscar por NF, cliente ou status...">
                        </div>
                    </div>
                    <h3>Notas Fiscais de Saída</h3>
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Nº NF</th>
                                <th>Venda #</th>
                                <th>Cliente</th>
                                <th>Data Emissão</th>
                                <th>Valor</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Protocolo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="nfWithdrawalTableBody">
                            ${withdrawals.length > 0 ? withdrawals.map(n => `
                                <tr>
                                    <td>${escapeHtml(n.nfNumber)}</td>
                                    <td>#${n.saleId}</td>
                                    <td>${escapeHtml(n.customerName) || '-'}</td>
                                    <td>${new Date(n.issuanceDate).toLocaleDateString('pt-BR')}</td>
                                    <td>R$ ${(n.totalValue || 0).toFixed(2)}</td>
                                    <td>${escapeHtml(n.nfType || 'NFCe')}</td>
                                    <td>${this.renderStatusBadge(n.status, n.contingency)}</td>
                                    <td style="font-size:11px;max-width:100px;overflow:hidden;text-overflow:ellipsis">${n.authorizationProtocol ? escapeHtml(n.authorizationProtocol) : '-'}</td>
                                    <td style="white-space:nowrap;text-align:center">
                                        <button class="btn-action btn-view-nf-withdrawal" data-id="${n.id}" title="Visualizar"><i class="fa-solid fa-eye"></i></button>
                                        ${n.status === 'Pendente' ? `<button class="btn-action btn-transmit-nf" data-id="${n.id}" title="Transmitir p/ SEFAZ"><i class="fa-solid fa-cloud-arrow-up"></i></button>` : ''}
                                        ${n.status === 'Pendente' || n.status === 'Emitida' ? `<button class="btn-action btn-print-nf" data-id="${n.id}" title="Imprimir DANFE"><i class="fa-solid fa-print"></i></button>` : ''}
                                        ${n.status === 'Emitida' && n.xmlFile ? `<button class="btn-action btn-xml-download" data-id="${n.id}" title="Download XML"><i class="fa-solid fa-file-code"></i></button>` : ''}
                                        ${n.status === 'Pendente' ? `<button class="btn-action btn-cancel-nf" data-id="${n.id}" title="Cancelar"><i class="fa-solid fa-ban"></i></button>` : ''}
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="9" style="text-align:center">Nenhuma NF de saída registrada.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderStatusBadge(status, contingency) {
        const isCtg = contingency == 1 || contingency === '1' || contingency === true;
        const map = {
            'Pendente': '<span style="color:#d97706;font-weight:bold">⏳ Pendente</span>',
            'Emitida': `<span style="color:#059c0d;font-weight:bold">✅ ${isCtg ? 'Emitida (CTG)' : 'Emitida'}</span>`,
            'Cancelada': '<span style="color:#dc2626;font-weight:bold">❌ Cancelada</span>',
            'Contingencia': '<span style="color:#e65100;font-weight:bold">⚠️ Contingência</span>',
        };
        return map[status] || escapeHtml(status);
    }

    printDANFE(nfData, items) {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        const formatCurrency = (v) => `R$ ${(v || 0).toFixed(2)}`;
        const formatDate = (d) => new Date(d).toLocaleString('pt-BR');
        const isCtg = nfData.contingency == 1 || nfData.contingency === '1' || nfData.contingency === true;

        printWindow.document.write(`
            <html>
            <head><title>DANFE NFCe - NF ${escapeHtml(nfData.nfNumber)}</title>
            <style>
                @page { margin: 10mm 8mm }
                body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 0; padding: 15px; }
                h1 { text-align: center; font-size: 16px; margin-bottom: 3px; color:#1a237e; }
                .header { text-align: center; font-size: 10px; margin-bottom: 10px; color: #666; }
                .title { text-align: center; font-size: 13px; font-weight: bold; margin: 10px 0; border-top: 2px solid #1a237e; border-bottom: 2px solid #1a237e; padding: 6px 0; background:#e8eaf6; }
                .ctg-badge { text-align:center;background:#e65100;color:#fff;padding:4px;font-weight:bold;font-size:11px;margin-bottom:8px; }
                table { width: 100%; border-collapse: collapse; margin: 6px 0; }
                th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; font-size: 10px; }
                th { background: #f0f0f0; font-size: 10px; }
                .right { text-align: right; }
                .center { text-align: center; }
                .chave { text-align:center;font-size:11px;font-weight:bold;margin:8px 0;letter-spacing:1px; }
                .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #888; border-top: 1px dashed #ccc; padding-top: 8px; }
                .protocolo { font-size:10px;color:#1a237e;margin:5px 0; }
            </style>
            </head>
            <body>
                ${isCtg ? '<div class="ctg-badge">DANFE EM CONTINGÊNCIA - SEM VALOR FISCAL</div>' : ''}
                <h1>FAGUNDES MOTO PEÇAS</h1>
                <div class="header">NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</div>
                <div class="title">DANFE NFC-e Nº ${escapeHtml(nfData.nfNumber || '')}</div>

                <table>
                    <tr><th colspan="2">Emitente</th></tr>
                    <tr><td style="width:120px">Razão Social:</td><td>Fagundes Moto Peças</td></tr>
                    <tr><td>CNPJ/CPF:</td><td>00.000.000/0001-00</td></tr>
                    <tr><td>IE:</td><td>000.000.000.000</td></tr>
                </table>

                <table>
                    <tr><th colspan="2">Destinatário</th></tr>
                    <tr><td style="width:120px">Nome:</td><td>${escapeHtml(nfData.customerName) || 'Consumidor'}</td></tr>
                    <tr><td>CPF/CNPJ:</td><td>${escapeHtml(nfData.customerDocument) || 'Não informado'}</td></tr>
                </table>

                <table>
                    <tr><th>CFOP</th><th>Natureza da Operação</th></tr>
                    <tr><td class="center">${escapeHtml(nfData.cfop)}</td><td>${escapeHtml(nfData.natureOperation || 'Venda')}</td></tr>
                </table>

                <table>
                    <thead>
                        <tr><th>Código</th><th>Produto</th><th class="center">Qtd</th><th class="right">Valor Unit.</th><th class="right">Total</th></tr>
                    </thead>
                    <tbody>
                        ${items && items.length > 0 ? items.map(i => `
                            <tr>
                                <td class="center">${escapeHtml(i.productId)}</td>
                                <td>${escapeHtml(i.productName)}</td>
                                <td class="center">${i.qty}</td>
                                <td class="right">${formatCurrency(i.unitPrice)}</td>
                                <td class="right">${formatCurrency(i.subtotal)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" class="center">Nenhum item</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr><th colspan="4" class="right">Total:</th><th class="right">${formatCurrency(nfData.totalValue)}</th></tr>
                    </tfoot>
                </table>

                <table>
                    <tr><th style="width:120px">Data de Emissão</th><th>Status</th><th>Protocolo</th></tr>
                    <tr><td>${formatDate(nfData.issuanceDate)}</td><td>${nfData.status}${isCtg ? ' (CTG)' : ''}</td><td>${escapeHtml(nfData.authorizationProtocol || '-')}</td></tr>
                </table>

                ${nfData.chNFe ? `<div class="chave">Chave de Acesso: ${nfData.chNFe}</div>` : ''}
                ${nfData.authorizationProtocol ? `<div class="protocolo">Protocolo: ${nfData.authorizationProtocol}</div>` : ''}

                <div class="footer">Documento gerado em ${new Date().toLocaleString('pt-BR')} - ${isCtg ? 'Sem valor fiscal - contingência' : 'Consulte a validade no site da SEFAZ'}</div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                <\\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    async showModal(nfData = null, sales = [], preSelectedSaleId = null, nextNumber = null) {
        const modal = document.getElementById('nfWithdrawalModal');
        if (!modal) return;

        const form = document.getElementById('nf-withdrawal-form');
        form.reset();

        const modalTitle = modal.querySelector('.modal-header h3');
        const modalDesc = modal.querySelector('.modal-header p');
        const submitBtn = modal.querySelector('button[type="submit"]');

        if (nfData) {
            document.getElementById('nwfId').value = nfData.id || '';
            document.getElementById('nwfSaleId').value = nfData.saleId;
            document.getElementById('nwfSaleInfo').textContent = `Venda #${nfData.saleId} - R$ ${(nfData.saleTotal || 0).toFixed(2)}`;
            document.getElementById('nwfCustomerName').value = nfData.customerName || '';
            document.getElementById('nwfCustomerDocument').value = nfData.customerDocument || '';
            document.getElementById('nwfCustomerAddress').value = nfData.customerAddress || '';
            document.getElementById('nwfNumber').value = nfData.nfNumber || '';
            document.getElementById('nwfType').value = nfData.nfType || 'NFCe';
            document.getElementById('nwfCfop').value = nfData.cfop || '5102';
            document.getElementById('nwfTotalValue').value = nfData.saleTotal || nfData.totalValue || '';

            modalTitle.innerHTML = '<i class="fa-solid fa-eye"></i> Detalhes da NF';
            modalDesc.textContent = 'Visualizando nota fiscal de saída.';
            submitBtn.style.display = 'none';
            document.getElementById('nwfPasswordGroup').style.display = 'none';
            document.getElementById('nwfSaleSelectGroup').style.display = 'none';
            document.getElementById('nwfProtocolGroup').style.display = nfData.authorizationProtocol ? '' : 'none';
            document.getElementById('nwfChaveGroup').style.display = nfData.chNFe ? '' : 'none';
            document.getElementById('nwfPrintGroup').style.display = '';
            if (document.getElementById('nwfProtocol')) document.getElementById('nwfProtocol').value = nfData.authorizationProtocol || '';
            if (document.getElementById('nwfChave')) document.getElementById('nwfChave').value = nfData.chNFe || '';
            await this.renderNFItems(nfData.saleId);
        } else {
            document.getElementById('nwfId').value = '';
            const saleSelect = document.getElementById('nwfSaleId');
            const filtered = sales.filter(s => !s.hasNF);
            saleSelect.innerHTML = '<option value="">Selecione uma venda...</option>' +
                filtered.map(s =>
                    `<option value="${s.id}" ${preSelectedSaleId == s.id ? 'selected' : ''}>#${s.id} - ${escapeHtml(s.customerName || 'Sem cliente')} - R$ ${(s.total || 0).toFixed(2)}</option>`
                ).join('');
            if (preSelectedSaleId) {
                const sale = filtered.find(s => s.id == preSelectedSaleId);
                if (sale) {
                    document.getElementById('nwfCustomerName').value = sale.customerName || '';
                    document.getElementById('nwfTotalValue').value = sale.total || '';
                }
            }

            if (nextNumber) {
                document.getElementById('nwfNumber').value = nextNumber;
            }

            modalTitle.innerHTML = '<i class="fa-solid fa-file-circle-plus"></i> Emitir NF de Saída';
            modalDesc.textContent = 'Selecione a venda e preencha os dados fiscais.';
            submitBtn.style.display = '';
            submitBtn.textContent = 'Emitir NF';
            document.getElementById('nwfPasswordGroup').style.display = '';
            document.getElementById('nwfSaleSelectGroup').style.display = '';
            document.getElementById('nwfProtocolGroup').style.display = 'none';
            document.getElementById('nwfChaveGroup').style.display = 'none';
            document.getElementById('nwfPrintGroup').style.display = 'none';
            document.getElementById('nwfItemsContainer').innerHTML = '';
        }

        modal.classList.add('active');
    }

    async renderNFItems(saleId) {
        const container = document.getElementById('nwfItemsContainer');
        try {
            const { fetchWithAuth } = await import('./api.js');
            const response = await fetchWithAuth(`/api/sales/${saleId}/items`);
            const items = await response.json();
            if (items && items.length > 0) {
                container.innerHTML = `
                    <h4 style="margin:15px 0 8px;font-size:14px;color:#333">Itens da Venda</h4>
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead><tr style="background:#f5f5f5">
                            <th style="padding:6px;border:1px solid #ddd;text-align:left">Produto</th>
                            <th style="padding:6px;border:1px solid #ddd">Qtd</th>
                            <th style="padding:6px;border:1px solid #ddd">Valor</th>
                        </tr></thead>
                        <tbody>
                            ${items.map(i => `
                                <tr>
                                    <td style="padding:6px;border:1px solid #ddd">${escapeHtml(i.productName)}</td>
                                    <td style="padding:6px;border:1px solid #ddd;text-align:center">${i.qty}</td>
                                    <td style="padding:6px;border:1px solid #ddd;text-align:right">R$ ${(i.subtotal || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
            }
            return items || [];
        } catch (e) {
            container.innerHTML = '<p style="color:#888;font-size:13px">Não foi possível carregar os itens.</p>';
            return [];
        }
    }

    closeModal() {
        const modal = document.getElementById('nfWithdrawalModal');
        if (modal) modal.classList.remove('active');
    }

    bindSearch() {
        const input = document.getElementById('nfWithdrawalSearch');
        if (!input) return;
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();

            const rows = document.querySelectorAll('#nfWithdrawalTableBody tr');
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

    bindDateFilter(filterHandler, clearHandler) {
        const btnFilter = document.getElementById('btnNfwFilter');
        const btnClear = document.getElementById('btnNfwClearFilter');
        if (btnFilter) btnFilter.onclick = () => {
            const start = document.getElementById('nfwFilterStart').value;
            const end = document.getElementById('nfwFilterEnd').value;
            filterHandler(start, end);
        };
        if (btnClear) btnClear.onclick = () => {
            document.getElementById('nfwFilterStart').value = '';
            document.getElementById('nfwFilterEnd').value = '';
            clearHandler();
        };
    }

    bindFormSubmit(handler) {
        const form = document.getElementById('nf-withdrawal-form');
        const btnCancel = document.getElementById('btnCancelNFWithdrawal');
        const saleSelect = document.getElementById('nwfSaleId');

        if (!form) return;
        btnCancel.onclick = () => this.closeModal();

        saleSelect.onchange = () => {
            const saleId = saleSelect.value;
            if (saleId) {
                const sale = this._availableSales?.find(s => String(s.id) === saleId);
                if (sale) {
                    document.getElementById('nwfCustomerName').value = sale.customerName || '';
                    document.getElementById('nwfTotalValue').value = sale.total || '';
                }
            }
        };

        form.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                saleId: parseInt(document.getElementById('nwfSaleId').value),
                nfNumber: document.getElementById('nwfNumber').value.trim(),
                nfType: document.getElementById('nwfType').value,
                cfop: document.getElementById('nwfCfop').value,
                customerDocument: document.getElementById('nwfCustomerDocument').value.trim(),
                customerAddress: document.getElementById('nwfCustomerAddress').value.trim(),
                totalValue: parseFloat(document.getElementById('nwfTotalValue').value) || 0
            };

            const password = document.getElementById('nwfPassword').value;
            if (!data.saleId) return showToast('Selecione uma venda.', 'warning');
            if (!data.nfNumber) return showToast('Informe o número da NF.', 'warning');
            if (!password) return showToast('Informe sua senha de confirmação.', 'warning');

            handler(data, password);
        };
    }

    bindViewDetails(printHandler) {
        if (this._viewBound) return;
        this._viewBound = true;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-view-nf-withdrawal');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            const nf = this.withdrawals.find(n => n.id === id);
            if (nf) this.showModal(nf);
        });
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#btnPrintDetailDANFE');
            if (!btn) return;
            const idInput = document.getElementById('nwfId');
            if (idInput && idInput.value) {
                const nfId = parseInt(idInput.value);
                const nf = this.withdrawals.find(n => n.id === nfId);
                if (nf && printHandler) printHandler(nf.id);
            }
        });
    }

    bindPrintAction(handler) {
        if (this._printBound) return;
        this._printBound = true;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-print-nf');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            handler(id);
        });
    }

    bindTransmitAction(handler) {
        if (this._transmitBound) return;
        this._transmitBound = true;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-transmit-nf');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            handler(id);
        });
    }

    bindCancelAction(handler) {
        if (this._cancelBound) return;
        this._cancelBound = true;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-cancel-nf');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            handler(id);
        });
    }

    bindDownloadXml() {
        if (this._xmlBound) return;
        this._xmlBound = true;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-xml-download');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            if (id) {
                window.open(`/api/nf-withdrawal/${id}/xml`, '_blank');
            }
        });
    }



    setAvailableSales(sales) {
        this._availableSales = sales;
    }
}
