import { escapeHtml } from './utils.js';

export class ConfigView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    render(settings, nfceConfig) {
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-gear"></i> Configurações</h2>`;
        document.getElementById('header-actions-container').innerHTML = '';

        this.container.innerHTML = `
            <style>
                .config-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: #fff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    max-width: 800px;
                    margin-top: 20px;
                    overflow: hidden;
                }
                .config-card-header {
                    padding: 18px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .config-card-header h3 { margin: 0; font-size: 1.05rem; color: #333; }
                .config-card-body { padding: 20px; }
                .config-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .config-summary-grid p { margin: 4px 0 0; font-size: 14px; color: #333; }
                .nfce-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .nfce-grid .full-width { grid-column: span 2; }
                @media (max-width: 600px) {
                    .nfce-grid { grid-template-columns: 1fr; }
                    .nfce-grid .full-width { grid-column: span 1; }
                }
            </style>

            <div class="inventory-section">
                <div class="config-card">
                    <div class="config-card-header">
                        <h3><i class="fa-solid fa-database"></i> Backup Automatizado</h3>
                        <button class="btn-primary-action" id="btnOpenBackupModal" style="height:34px;padding:0 16px;font-size:13px"><i class="fa-solid fa-pen"></i> Configurar</button>
                    </div>
                    <div class="config-card-body">
                        <div class="config-summary-grid">
                            <div class="form-group-inventory" style="margin:0">
                                <label>Intervalo</label>
                                <p><strong>${settings.backupInterval}</strong> horas</p>
                            </div>
                            <div class="form-group-inventory" style="margin:0">
                                <label>Limite de Arquivos</label>
                                <p><strong>${settings.maxBackups}</strong> arquivos</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="config-card">
                    <div class="config-card-header">
                        <h3><i class="fa-solid fa-file-export"></i> NFCe (Nota Fiscal Eletrônica)</h3>
                        <button class="btn-primary-action" id="btnOpenNfceModal" style="height:34px;padding:0 16px;font-size:13px"><i class="fa-solid fa-pen"></i> Configurar</button>
                    </div>
                    <div class="config-card-body">
                        <div class="config-summary-grid">
                            <div class="form-group-inventory" style="margin:0">
                                <label>CNPJ</label>
                                <p>${nfceConfig.cnpj ? escapeHtml(nfceConfig.cnpj) : '<span style="color:#999">Não configurado</span>'}</p>
                            </div>
                            <div class="form-group-inventory" style="margin:0">
                                <label>Ambiente</label>
                                <p>${nfceConfig.ambiente == 1 ? 'Produção' : 'Homologação'}</p>
                            </div>
                            <div class="form-group-inventory" style="margin:0">
                                <label>Razão Social</label>
                                <p>${nfceConfig.razaoSocial ? escapeHtml(nfceConfig.razaoSocial) : '<span style="color:#999">Não configurado</span>'}</p>
                            </div>
                            <div class="form-group-inventory" style="margin:0">
                                <label>Certificado A1</label>
                                <p>${nfceConfig.certPath ? 'Configurado' : '<span style="color:#999">Não configurado</span>'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Backup -->
            <div class="modal" id="modalBackup">
                <div class="modal-content" style="max-width:450px">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-database"></i> Configurar Backup</h3>
                        <p>Altere o intervalo e o limite de arquivos de backup.</p>
                    </div>
                    <form id="formBackup">
                        <div class="form-group-inventory">
                            <label>Intervalo (horas)</label>
                            <input type="number" id="inpBackupInterval" class="search-input" value="${settings.backupInterval}" min="1" required>
                        </div>
                        <div class="form-group-inventory" style="margin-top:10px">
                            <label>Limite de Arquivos</label>
                            <input type="number" id="inpBackupMaxFiles" class="search-input" value="${settings.maxBackups}" min="1" required>
                        </div>
                        <div class="form-group-inventory" style="margin-top:15px">
                            <label><i class="fa-solid fa-shield-halved"></i> Senha de Administrador</label>
                            <input type="password" id="inpBackupPassword" class="search-input" placeholder="Confirme sua senha para salvar" required>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn-submit-inventory" style="flex:2"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
                            <button type="button" class="btn-secondary btn-close-modal" style="flex:1;background:#666">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal NFCe -->
            <div class="modal" id="modalNfce">
                <div class="modal-content" style="max-width:650px;max-height:90vh;overflow-y:auto">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-file-export"></i> Configurar NFCe</h3>
                        <p>Dados da empresa para emissão de Nota Fiscal Eletrônica.</p>
                    </div>
                    <form id="formNfce">
                        <div class="nfce-grid">
                            <div class="form-group-inventory">
                                <label>UF</label>
                                <input type="text" id="inpNfceUf" class="search-input" maxlength="2" value="${escapeHtml(nfceConfig.uf || 'SP')}">
                            </div>
                            <div class="form-group-inventory">
                                <label>Ambiente</label>
                                <select id="inpNfceAmbiente" class="search-input">
                                    <option value="2" ${nfceConfig.ambiente == 2 ? 'selected' : ''}>Homologação (Testes)</option>
                                    <option value="1" ${nfceConfig.ambiente == 1 ? 'selected' : ''}>Produção</option>
                                </select>
                            </div>
                            <div class="form-group-inventory full-width">
                                <label>CNPJ</label>
                                <input type="text" id="inpNfceCnpj" class="search-input" value="${escapeHtml(nfceConfig.cnpj || '')}" placeholder="00.000.000/0001-00">
                            </div>
                            <div class="form-group-inventory full-width">
                                <label>Razão Social</label>
                                <input type="text" id="inpNfceRazao" class="search-input" value="${escapeHtml(nfceConfig.razaoSocial || '')}" placeholder="Nome da empresa">
                            </div>
                            <div class="form-group-inventory full-width">
                                <label>Nome Fantasia</label>
                                <input type="text" id="inpNfceFantasia" class="search-input" value="${escapeHtml(nfceConfig.nomeFantasia || '')}" placeholder="Nome fantasia">
                            </div>
                            <div class="form-group-inventory">
                                <label>Inscrição Estadual</label>
                                <input type="text" id="inpNfceIe" class="search-input" value="${escapeHtml(nfceConfig.ie || '')}">
                            </div>
                            <div class="form-group-inventory">
                                <label>CRT</label>
                                <select id="inpNfceCrt" class="search-input">
                                    <option value="1" ${nfceConfig.crt == 1 ? 'selected' : ''}>Simples Nacional</option>
                                    <option value="2" ${nfceConfig.crt == 2 ? 'selected' : ''}>Simples Nacional - Excesso</option>
                                    <option value="3" ${nfceConfig.crt == 3 ? 'selected' : ''}>Regime Normal</option>
                                </select>
                            </div>
                            <div class="form-group-inventory full-width">
                                <label>Endereço</label>
                                <input type="text" id="inpNfceEndereco" class="search-input" value="${escapeHtml(nfceConfig.endereco || '')}" placeholder="Rua, Av...">
                            </div>
                            <div class="form-group-inventory">
                                <label>Número</label>
                                <input type="text" id="inpNfceNumero" class="search-input" value="${escapeHtml(nfceConfig.numero || '')}" placeholder="S/N">
                            </div>
                            <div class="form-group-inventory">
                                <label>Bairro</label>
                                <input type="text" id="inpNfceBairro" class="search-input" value="${escapeHtml(nfceConfig.bairro || '')}">
                            </div>
                            <div class="form-group-inventory">
                                <label>Cidade</label>
                                <input type="text" id="inpNfceCidade" class="search-input" value="${escapeHtml(nfceConfig.cidade || '')}" placeholder="São Paulo">
                            </div>
                            <div class="form-group-inventory">
                                <label>Cód. Município IBGE</label>
                                <input type="text" id="inpNfceCodMun" class="search-input" value="${escapeHtml(nfceConfig.codMun || '')}" placeholder="3550308">
                            </div>
                            <div class="form-group-inventory">
                                <label>CEP</label>
                                <input type="text" id="inpNfceCep" class="search-input" value="${escapeHtml(nfceConfig.cep || '')}">
                            </div>
                            <div class="form-group-inventory">
                                <label>Telefone</label>
                                <input type="text" id="inpNfceFone" class="search-input" value="${escapeHtml(nfceConfig.fone || '')}">
                            </div>
                            <div class="form-group-inventory">
                                <label>Série NFCe</label>
                                <input type="number" id="inpNfceSerie" class="search-input" value="${nfceConfig.serie || 0}">
                            </div>
                            <div class="form-group-inventory">
                                <label>NCM Padrão</label>
                                <input type="text" id="inpNfceNcm" class="search-input" value="${escapeHtml(nfceConfig.ncmPadrao || '')}" placeholder="87141000">
                            </div>
                            <div class="form-group-inventory full-width">
                                <label>Caminho do Certificado A1 (.pfx)</label>
                                <input type="text" id="inpNfceCertPath" class="search-input" value="${escapeHtml(nfceConfig.certPath || '')}" placeholder="C:/certs/certificado.pfx">
                            </div>
                            <div class="form-group-inventory full-width">
                                <label>Senha do Certificado</label>
                                <input type="password" id="inpNfceCertPassword" class="search-input" placeholder="********">
                            </div>
                            <div class="form-group-inventory full-width" style="margin-top:5px">
                                <label><i class="fa-solid fa-shield-halved"></i> Senha de Administrador</label>
                                <input type="password" id="inpNfcePassword" class="search-input" placeholder="Confirme sua senha para salvar" required>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn-submit-inventory" style="flex:2"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
                            <button type="button" class="btn-secondary btn-close-modal" style="flex:1;background:#666">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.bindModalToggle();
    }

    bindModalToggle() {
        document.addEventListener('click', (e) => {
            const btnOpenBackup = e.target.closest('#btnOpenBackupModal');
            const btnOpenNfce = e.target.closest('#btnOpenNfceModal');
            const btnClose = e.target.closest('.btn-close-modal');
            const modalBackup = document.getElementById('modalBackup');
            const modalNfce = document.getElementById('modalNfce');

            if (btnOpenBackup && modalBackup) modalBackup.classList.add('active');
            if (btnOpenNfce && modalNfce) modalNfce.classList.add('active');

            if (btnClose) {
                if (modalBackup) modalBackup.classList.remove('active');
                if (modalNfce) modalNfce.classList.remove('active');
            }
        });
    }

    closeModals() {
        const modals = document.querySelectorAll('#modalBackup, #modalNfce');
        modals.forEach(m => m.classList.remove('active'));
    }

    bindSaveBackup(handler) {
        const form = document.getElementById('formBackup');
        if (!form) return;
        form.onsubmit = (e) => {
            e.preventDefault();
            handler({
                backupInterval: document.getElementById('inpBackupInterval').value,
                maxBackups: document.getElementById('inpBackupMaxFiles').value,
                password: document.getElementById('inpBackupPassword').value
            });
        };
    }

    bindSaveNfce(handler) {
        const form = document.getElementById('formNfce');
        if (!form) return;
        form.onsubmit = (e) => {
            e.preventDefault();
            handler({
                uf: document.getElementById('inpNfceUf').value,
                ambiente: parseInt(document.getElementById('inpNfceAmbiente').value),
                cnpj: document.getElementById('inpNfceCnpj').value,
                razaoSocial: document.getElementById('inpNfceRazao').value,
                nomeFantasia: document.getElementById('inpNfceFantasia').value,
                ie: document.getElementById('inpNfceIe').value,
                crt: parseInt(document.getElementById('inpNfceCrt').value),
                endereco: document.getElementById('inpNfceEndereco').value,
                numero: document.getElementById('inpNfceNumero').value,
                bairro: document.getElementById('inpNfceBairro').value,
                cidade: document.getElementById('inpNfceCidade').value,
                codMun: document.getElementById('inpNfceCodMun').value,
                cep: document.getElementById('inpNfceCep').value,
                fone: document.getElementById('inpNfceFone').value,
                serie: parseInt(document.getElementById('inpNfceSerie').value) || 0,
                ncmPadrao: document.getElementById('inpNfceNcm').value,
                certPath: document.getElementById('inpNfceCertPath').value,
                certPassword: document.getElementById('inpNfceCertPassword').value,
                password: document.getElementById('inpNfcePassword').value
            });
        };
    }
}
