import { showToast } from './utils.js';

export class ConfigController {
    constructor(model, view, authModel) {
        this.model = model;
        this.view = view;
        this.authModel = authModel;
    }

    async showSettings() {
        const [settings, nfceConfig] = await Promise.all([
            this.model.getSettings(),
            this.model.getNfceConfig()
        ]);
        this.view.render(settings, nfceConfig);
        this.view.bindSaveBackup(this.handleSaveBackup.bind(this));
        this.view.bindSaveNfce(this.handleSaveNfce.bind(this));
    }

    async handleSaveBackup(data) {
        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Alteração não autorizada.', 'error');

        const { password, ...settings } = data;
        const result = await this.model.updateSettings(settings);
        if (result.success) {
            this.view.closeModals();
            showToast('Configurações atualizadas com sucesso!', 'success');
            this.showSettings();
        } else {
            showToast('Erro ao atualizar configurações.', 'error');
        }
    }

    async handleSaveNfce(data) {
        const userEmail = localStorage.getItem('currentUser');
        const isValid = await this.authModel.authenticate(userEmail, data.password);
        if (!isValid || !isValid.success) return showToast('Senha incorreta! Alteração não autorizada.', 'error');

        const { password, ...config } = data;
        const result = await this.model.saveNfceConfig(config);
        if (result.success) {
            this.view.closeModals();
            showToast('Configuração NFCe salva com sucesso!', 'success');
            this.showSettings();
        } else {
            showToast(result.error || 'Erro ao salvar configuração NFCe.', 'error');
        }
    }
}
