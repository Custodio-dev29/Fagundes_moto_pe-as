import { showToast, showConfirm, showPrompt } from './utils.js';
import { fetchWithAuth } from './api.js';

export class NFWithdrawalController {
    constructor(model, view, authModel) {
        this.model = model;
        this.view = view;
        this.authModel = authModel;
        this._currentFilters = { start: null, end: null };
    }

    async showNFWithdrawals() {
        const withdrawals = await this.loadWithFilter();
        this.view.render(withdrawals);
        this.view.bindSearch();
        this.view.bindViewDetails(this.handlePrintDANFE.bind(this));
        this.view.bindPrintAction(this.handlePrintDANFE.bind(this));
        this.view.bindTransmitAction(this.handleTransmitNF.bind(this));
        this.view.bindCancelAction(this.handleCancelNF.bind(this));
        this.view.bindDownloadXml();
        this.view.bindFormSubmit(this.handleCreateNF.bind(this));
        this.view.bindDateFilter(
            (start, end) => this.handleDateFilter(start, end),
            () => this.handleClearFilter()
        );
        document.addEventListener('click', async (e) => {
            if (e.target.closest('#btn-open-nf-withdrawal-modal')) {
                const [sales, nextNumber] = await Promise.all([
                    this.getSalesWithoutNF(),
                    this.model.getNextNumber()
                ]);
                this.view.setAvailableSales(sales);
                this.view.showModal(null, sales, null, nextNumber);
            }
        });
    }

    async loadWithFilter() {
        const { start, end } = this._currentFilters;
        if (start && end) {
            return await this.model.getByPeriod(start, end);
        }
        return await this.model.getAll();
    }

    async handleDateFilter(start, end) {
        if (!start || !end) return showToast('Selecione data início e fim.', 'warning');
        this._currentFilters = { start, end };
        const withdrawals = await this.loadWithFilter();
        this.view.render(withdrawals);
        this.view.bindSearch();
        this.view.bindViewDetails();
        this.view.bindPrintAction(this.handlePrintDANFE.bind(this));
        this.view.bindTransmitAction(this.handleTransmitNF.bind(this));
        this.view.bindCancelAction(this.handleCancelNF.bind(this));
        this.view.bindDownloadXml();
        this.view.bindFormSubmit(this.handleCreateNF.bind(this));
        this.view.bindDateFilter(
            (s, e) => this.handleDateFilter(s, e),
            () => this.handleClearFilter()
        );
        showToast(`Filtrado: ${withdrawals.length} NF(s) encontrada(s).`, 'info');
    }

    async handleClearFilter() {
        this._currentFilters = { start: null, end: null };
        this.showNFWithdrawals();
    }

    async getSalesWithoutNF() {
        try {
            const response = await fetchWithAuth('/api/sales');
            const allSales = await response.json();
            const withdrawals = await this.model.getAll();

            const salesWithActiveNF = new Set(
                withdrawals.filter(w => w.status !== 'Cancelada').map(w => w.saleId)
            );
            return allSales.map(s => ({
                ...s,
                hasNF: salesWithActiveNF.has(s.id)
            }));
        } catch (e) {
            console.error("Erro ao carregar vendas:", e);
            return [];
        }
    }

    async handleCreateNF(data, password) {
        const isValid = await this.authModel.authenticate(
            localStorage.getItem('currentUser'), password
        );
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Emissão negada.', 'error');

        const result = await this.model.create(data);
        if (result.success) {
            this.view.closeModal();
            document.getElementById('nwfPassword').value = '';
            showToast('NF de saída emitida com sucesso!', 'success');
            this.showNFWithdrawals();
        } else {
            showToast(result.error || 'Erro ao emitir NF.', 'error');
        }
    }

    async openModalForSale(saleId) {
        const [sales, nextNumber] = await Promise.all([
            this.getSalesWithoutNF(),
            this.model.getNextNumber()
        ]);
        if (!sales.find(s => s.id === saleId)) {
            return showToast('Venda não encontrada ou já possui NF ativa.', 'warning');
        }
        this.view.setAvailableSales(sales);
        this.view.showModal(null, sales, saleId, nextNumber);
    }

    async handlePrintDANFE(nfId) {
        const nf = await this.model.getById(nfId);
        if (!nf) return showToast('NF não encontrada.', 'error');
        try {
            const response = await fetchWithAuth(`/api/sales/${nf.saleId}/items`);
            const items = await response.json();
            this.view.printDANFE(nf, items || []);
        } catch (e) {
            this.view.printDANFE(nf, []);
        }
    }

    async handleTransmitNF(id) {
        const confirmed = await showConfirm(`Deseja transmitir esta NF para a SEFAZ?`);
        if (!confirmed) return;

        const nf = await this.model.getById(id);
        if (!nf) return showToast('NF não encontrada.', 'error');

        const useContingency = await showConfirm(
            `Deseja enviar para a SEFAZ ou emitir em contingência offline?\n\n` +
            `Clique OK para enviar para SEFAZ, ou CANCELAR para emitir em contingência.`
        );

        if (useContingency) {
            const justification = await showPrompt('Justificativa para contingência:');
            if (!justification) return showToast('Operação cancelada.', 'info');
            const result = await this.model.contingency(id, justification);
            if (result.success) {
                showToast(`NF emitida em contingência!`, 'success');
                this.showNFWithdrawals();
            } else {
                showToast(result.error || 'Erro na contingência.', 'error');
            }
        } else {
            showToast('Transmitindo NF para SEFAZ...', 'info');
            const result = await this.model.transmit(id);
            if (result.success) {
                const mode = result.contingency ? ' (Contingência)' : '';
                showToast(`NF transmitida${mode}! Protocolo: ${result.protocol || 'N/A'}`, 'success');
                this.showNFWithdrawals();
            } else {
                showToast(result.error || 'Erro na transmissão.', 'error');
            }
        }
    }

    async handleCancelNF(id) {
        const confirmed = await showConfirm(`Deseja realmente cancelar esta NF? O vínculo com a venda será desfeito e você poderá emitir uma nova NF.`);
        if (!confirmed) return;

        const password = await showPrompt('Para confirmar o cancelamento, digite sua senha:');
        if (!password) return;

        const isValid = await this.authModel.authenticate(
            localStorage.getItem('currentUser'), password
        );
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Cancelamento negado.', 'error');

        const result = await this.model.cancel(id);
        if (result.success) {
            showToast('NF cancelada com sucesso! A venda está livre para nova emissão.', 'success');
            this.showNFWithdrawals();
        } else {
            showToast(result.error || 'Erro ao cancelar NF.', 'error');
        }
    }

}
