export class ConfigView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    render(settings) {
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-gear"></i> Configurações</h2>`;
        document.getElementById('header-actions-container').innerHTML = '';
        
        this.container.innerHTML = `
            <style>
                .accordion-item {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    margin-top: 20px;
                    background: #fff;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .accordion-header {
                    padding: 15px 20px;
                    background: #f8f9fa;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background 0.3s;
                }
                .accordion-header:hover { background: #f1f1f1; }
                .accordion-header h3 { margin: 0; font-size: 1.1rem; color: #333; }
                .accordion-content {
                    display: none;
                    padding: 20px;
                    border-top: 1px solid #ddd;
                    animation: slideDown 0.3s ease-out;
                }
                .accordion-content.active { display: block; }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .config-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
            </style>

            <div class="inventory-section">
                <div class="accordion-item" style="max-width: 800px;">
                    <div class="accordion-header" id="accordion-toggle">
                        <h3><i class="fa-solid fa-database"></i> Configurações de Backup Automatizado</h3>
                        <i class="fa-solid fa-chevron-down" id="toggle-icon"></i>
                    </div>
                    
                    <div class="accordion-content" id="accordion-body">
                        <div class="config-summary-grid">
                            <div class="form-group-inventory">
                                <label>Intervalo Atual</label>
                                <p><strong>${settings.backupInterval} horas</strong></p>
                            </div>
                            <div class="form-group-inventory">
                                <label>Limite de Arquivos</label>
                                <p><strong>${settings.maxBackups} arquivos</strong></p>
                            </div>
                        </div>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <form id="settings-form">
                            <div class="form-group-inventory" style="margin-bottom: 15px;">
                                <label>Novo Intervalo (Horas)</label>
                                <input type="number" id="setBackupInterval" value="${settings.backupInterval}" min="1" required>
                            </div>

                            <div class="form-group-inventory" style="margin-bottom: 15px;">
                                <label>Novo Limite de Arquivos</label>
                                <input type="number" id="setMaxBackups" value="${settings.maxBackups}" min="1" required>
                            </div>

                            <div class="form-group-inventory" style="margin-bottom: 15px;">
                                <label><i class="fa-solid fa-shield-halved"></i> Senha de Administrador</label>
                                <input type="password" id="setConfigPassword" placeholder="Confirme sua senha para salvar" required>
                            </div>

                            <div style="margin-top: 25px;">
                                <button type="submit" class="btn-submit-inventory" style="width: auto; padding: 10px 40px;">
                                    <i class="fa-solid fa-floppy-disk"></i> Aplicar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const toggle = document.getElementById('accordion-toggle');
        const body = document.getElementById('accordion-body');
        const icon = document.getElementById('toggle-icon');

        if (toggle && body) {
            toggle.onclick = () => {
                const isActive = body.classList.toggle('active');
                icon.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
                icon.style.transition = 'transform 0.3s';
            };
        }
    }

    bindSaveSettings(handler) {
        const form = document.getElementById('settings-form');
        if (!form) return;

        form.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                backupInterval: document.getElementById('setBackupInterval').value,
                maxBackups: document.getElementById('setMaxBackups').value,
                password: document.getElementById('setConfigPassword').value
            };
            handler(data);
        };
    }
}