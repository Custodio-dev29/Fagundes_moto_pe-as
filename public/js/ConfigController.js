export class ConfigController {
    constructor(model, view, authModel) {
        this.model = model;
        this.view = view;
        this.authModel = authModel;
    }

    async showSettings() {
        const settings = await this.model.getSettings();
        this.view.render(settings);
        this.view.bindSaveSettings(this.handleSaveSettings.bind(this));
    }

    async handleSaveSettings(data) {
        const userEmail = localStorage.getItem('currentUser');
        
        // Valida a senha antes de enviar as novas configurações para o servidor
        const isValid = await this.authModel.authenticate(userEmail, data.password);

        if (isValid && isValid.success) {
            const { password, ...settings } = data; // Remove a senha dos dados de envio
            const result = await this.model.updateSettings(settings);
            if (result.success) {
                alert('Configurações atualizadas com sucesso!');
                this.showSettings();
            } else {
                alert('Erro ao atualizar configurações.');
            }
        } else {
            alert('Senha incorreta! Alteração não autorizada.');
        }
    }
}