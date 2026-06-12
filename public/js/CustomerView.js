import { escapeHtml } from './utils.js';

export class CustomerView {
    constructor() {
        this.container = document.querySelector('.content-body');
    }

    render(customers) {
        document.getElementById('header-title-container').innerHTML = `<h2><i class="fa-solid fa-users"></i> Gerenciamento de Clientes</h2>`;
        document.getElementById('header-actions-container').innerHTML = `
            <button id="btn-open-customer-modal" class="btn-primary-action"><i class="fa-solid fa-plus"></i> Novo Cliente</button>
        `;
        this.container.innerHTML = `
            <div class="inventory-section">
                <div class="inventory-list">
                <h3>Todos os Clientes</h3>
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Telefone</th>
                            <th>CPF/CNPJ</th>
                            <th>Cidade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="customerTableBody">
                        ${customers.length > 0 ? customers.map(c => `
                            <tr>
                                <td>${escapeHtml(c.name)}</td>
                                <td>${escapeHtml(c.phone)}</td>
                                <td>${escapeHtml(c.document) || '-'}</td>
                                <td>${escapeHtml(c.city) || '-'}</td>
                                <td>
                                    <button class="btn-edit-action" data-id="${escapeHtml(c.id)}" title="Editar cliente">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>'}
                    </tbody>
                </table>
            </div>
            </div>
        `;
    }

    showRegisterModal() {
        const modal = document.getElementById('customerModal');
        if (modal) {
            document.getElementById('customer-form').reset();
            modal.classList.add('active');
        }
    }

    closeRegisterModal() {
        const modal = document.getElementById('customerModal');
        if (modal) modal.classList.remove('active');
    }

    showEditModal(customer) {
        const modal = document.getElementById('editCustomerModal');
        if (modal) {
            document.getElementById('editCustId').value = customer.id;
            document.getElementById('editCustName').value = customer.name;
            document.getElementById('editCustPhone').value = customer.phone;
            document.getElementById('editCustDocument').value = customer.document || '';
            document.getElementById('editCustIe').value = customer.ie || '';
            document.getElementById('editCustAddress').value = customer.address || '';
            document.getElementById('editCustCity').value = customer.city || '';
            document.getElementById('editCustState').value = customer.state || '';
            document.getElementById('editCustZipCode').value = customer.zipCode || '';
            modal.classList.add('active');
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editCustomerModal');
        if (modal) modal.classList.remove('active');
    }

    _applyPhoneMask(inputElement) {
        inputElement.addEventListener('input', (e) => {
            let input = e.target.value.replace(/\D/g, '');
            input = input.substring(0, 11);
            const len = input.length;
            if (len === 0) e.target.value = '';
            else if (len <= 2) e.target.value = `(${input}`;
            else if (len <= 6) e.target.value = `(${input.slice(0, 2)}) ${input.slice(2)}`;
            else if (len <= 10) e.target.value = `(${input.slice(0, 2)}) ${input.slice(2, 6)}-${input.slice(6)}`;
            else e.target.value = `(${input.slice(0, 2)}) ${input.slice(2, 7)}-${input.slice(7)}`;
        });
    }

    bindAddCustomer(handler) {
        const form = document.getElementById('customer-form');
        const btnCancel = document.getElementById('btnCancelCustomer');
        if (!form || !btnCancel) return;

        btnCancel.onclick = () => this.closeRegisterModal();
        this._applyPhoneMask(document.getElementById('custPhone'));

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handler({
                name: document.getElementById('custName').value,
                phone: document.getElementById('custPhone').value,
                document: document.getElementById('custDocument').value,
                ie: document.getElementById('custIe').value,
                address: document.getElementById('custAddress').value,
                city: document.getElementById('custCity').value,
                state: document.getElementById('custState').value,
                zipCode: document.getElementById('custZipCode').value
            });
        });
    }

    bindEditAction(onOpenModal) {
        const tableBody = document.getElementById('customerTableBody');
        if (!tableBody) return;
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-edit-action');
            if (btn) onOpenModal(btn.dataset.id);
        });
    }

    bindConfirmEdit(onUpdate, onDelete) {
        const form = document.getElementById('editCustomerForm');
        const btnDelete = document.getElementById('btnDeleteCustomer');
        const btnCancel = document.getElementById('btnCancelEditCustomer');
        if (!form) return;

        this._applyPhoneMask(document.getElementById('editCustPhone'));
        btnCancel.onclick = () => this.closeEditModal();
        
        btnDelete.onclick = () => onDelete(
            parseInt(document.getElementById('editCustId').value)
        );

        form.onsubmit = (e) => {
            e.preventDefault();
            onUpdate({
                id: parseInt(document.getElementById('editCustId').value),
                name: document.getElementById('editCustName').value,
                phone: document.getElementById('editCustPhone').value,
                document: document.getElementById('editCustDocument').value,
                ie: document.getElementById('editCustIe').value,
                address: document.getElementById('editCustAddress').value,
                city: document.getElementById('editCustCity').value,
                state: document.getElementById('editCustState').value,
                zipCode: document.getElementById('editCustZipCode').value
            });
        };
    }
}