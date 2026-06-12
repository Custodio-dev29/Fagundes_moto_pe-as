import { InventoryModel } from './InventoryModel.js';
import { InventoryView } from './InventoryView.js';
import { InventoryController } from './InventoryController.js';
import { AuthModel } from './AuthModel.js';
import { CustomerModel } from './CustomerModel.js';
import { CustomerView } from './CustomerView.js';
import { CustomerController } from './CustomerController.js';
import { SaleModel } from './SaleModel.js';
import { SaleView } from './SaleView.js';
import { SaleHistoryView } from './SaleHistoryView.js';
import { SaleController } from './SaleController.js';
import { ConfigModel } from './ConfigModel.js';
import { ConfigView } from './ConfigView.js';
import { ConfigController } from './ConfigController.js';
import { NFEntryModel } from './NFEntryModel.js';
import { NFEntryView } from './NFEntryView.js';
import { NFEntryController } from './NFEntryController.js';
import { NFWithdrawalModel } from './NFWithdrawalModel.js';
import { NFWithdrawalView } from './NFWithdrawalView.js';
import { NFWithdrawalController } from './NFWithdrawalController.js';
import { CashClosureView } from './CashClosureView.js';
import { CashClosureController } from './CashClosureController.js';
import { fetchWithAuth } from './api.js';
import { showToast, showConfirm } from './utils.js';

// Remove Service Workers antigos que podem estar travando o cache/listas
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
}

const btnToggle = document.getElementById('btn-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuCashClosure = document.getElementById('menu-cash-closure');
const menuInventory = document.getElementById('menu-inventory');
const menuRegisterPart = document.getElementById('menu-register-part');
const menuCustomers = document.getElementById('menu-customers');
const menuSales = document.getElementById('menu-sales');
const menuSettings = document.getElementById('menu-settings');
const menuNFEntry = document.getElementById('menu-nf-entry');
const menuNFWithdrawal = document.getElementById('menu-nf-withdrawal');
const menuShutdown = document.getElementById('menu-shutdown');

const toggleSidebar = () => {
    sidebar.classList.toggle('collapsed');
    overlay.classList.toggle('active');
};

btnToggle.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Instâncias de modelos para compartilhamento de dados
const inventoryModel = new InventoryModel();
const customerModel = new CustomerModel();
const authModel = new AuthModel();

// Proteção client-side: verifica autenticação via cookie httpOnly
(async () => {
    try {
        const isAuth = await authModel.checkAuth();
        if (!isAuth) {
            window.location.replace('index.html');
        }
    } catch (e) {
        window.location.replace('index.html');
    }
})();

// Controlador único para estoque
const inventoryController = new InventoryController(
    inventoryModel, 
    new InventoryView(),
    authModel
);

const cashClosureController = new CashClosureController(new CashClosureView());

const customerController = new CustomerController(
    customerModel,
    new CustomerView(),
    authModel
);

const nfWithdrawalModel = new NFWithdrawalModel();
const nfWithdrawalView = new NFWithdrawalView();

const nfWithdrawalController = new NFWithdrawalController(
    nfWithdrawalModel,
    nfWithdrawalView,
    authModel
);

const saleController = new SaleController(
    new SaleModel(),
    new SaleView(),
    new SaleHistoryView(),
    customerModel,
    inventoryModel,
    authModel,
    nfWithdrawalModel,
    nfWithdrawalController
);

const configController = new ConfigController(
    new ConfigModel(),
    new ConfigView(),
    authModel
);

const nfEntryController = new NFEntryController(
    new NFEntryModel(),
    new NFEntryView(),
    inventoryModel,
    authModel
);

const handleMenuClick = (menuId, callback) => {
    const element = document.getElementById(menuId);
    if (element) {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            element.classList.add('active');
            callback();
            if (window.innerWidth <= 992) toggleSidebar();
        });
    }
};

if (menuCashClosure) {
    handleMenuClick('menu-cash-closure', () => cashClosureController.showClosure());
}

if (menuInventory) {
    handleMenuClick('menu-inventory', () => inventoryController.showInventory());
}

if (menuRegisterPart) {
    handleMenuClick('menu-register-part', () => inventoryController.showRegistration());
}

if (menuCustomers) {
    handleMenuClick('menu-customers', () => customerController.showCustomers());
}

if (menuSales) {
    handleMenuClick('menu-sales', () => saleController.showSales());
}

if (document.getElementById('menu-sales-history')) {
    handleMenuClick('menu-sales-history', () => saleController.showHistory());
}

if (menuSettings) {
    handleMenuClick('menu-settings', () => configController.showSettings());
}

if (menuNFEntry) {
    handleMenuClick('menu-nf-entry', () => nfEntryController.showNFEntries());
}

if (menuNFWithdrawal) {
    handleMenuClick('menu-nf-withdrawal', () => nfWithdrawalController.showNFWithdrawals());
}

if (menuShutdown) {
    menuShutdown.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmed = await showConfirm('Deseja realmente desligar o servidor e encerrar o sistema?');
        if (confirmed) {
            try {
                await fetchWithAuth('/api/system/shutdown', { method: 'POST' });
                document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;"><h1>Sistema Encerrado</h1><p>O servidor foi desligado com sucesso. Pode fechar esta aba.</p></div>';
                setTimeout(() => window.close(), 2000);
            } catch (err) {
                showToast('Servidor desligado.', 'info');
            }
        }
    });
}

// Delegação de evento para o botão Novo Item que agora é dinâmico na View
document.addEventListener('click', async (e) => {
    if (e.target.closest('#btn-open-register-modal')) {
        inventoryController.view.showRegisterModal();
    }
    if (e.target.closest('#btn-open-customer-modal')) {
        customerController.view.showRegisterModal();
    }
    if (e.target.closest('#btn-open-nf-modal')) {
        nfEntryController.view.showModal();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 992) overlay.classList.remove('active');
});

// Carga inicial: Mostra o estoque automaticamente
inventoryController.showInventory();