import { InventoryModel } from './InventoryModel.js';
import { InventoryView } from './InventoryView.js';
import { InventoryController } from './InventoryController.js';
import { AuthModel } from './AuthModel.js';
import { CustomerModel } from './CustomerModel.js';
import { CustomerView } from './CustomerView.js';
import { CustomerController } from './CustomerController.js';
import { SaleModel } from './SaleModel.js';
import { SaleView } from './SaleView.js';
import { SaleController } from './SaleController.js';
import { ConfigModel } from './ConfigModel.js';
import { ConfigView } from './ConfigView.js';
import { ConfigController } from './ConfigController.js';

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
const menuInventory = document.getElementById('menu-inventory');
const menuRegisterPart = document.getElementById('menu-register-part');
const menuCustomers = document.getElementById('menu-customers');
const menuSales = document.getElementById('menu-sales');
const menuSettings = document.getElementById('menu-settings');

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

// Controlador único para estoque
const inventoryController = new InventoryController(
    inventoryModel, 
    new InventoryView(),
    authModel
);

const customerController = new CustomerController(
    customerModel,
    new CustomerView(),
    authModel
);

const saleController = new SaleController(
    new SaleModel(),
    new SaleView(),
    customerModel,
    inventoryModel,
    authModel
);

const configController = new ConfigController(
    new ConfigModel(),
    new ConfigView(),
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

if (menuSettings) {
    handleMenuClick('menu-settings', () => configController.showSettings());
}

// Delegação de evento para o botão Novo Item que agora é dinâmico na View
document.addEventListener('click', async (e) => {
    if (e.target.closest('#btn-open-register-modal')) {
        inventoryController.view.showRegisterModal();
    }
    if (e.target.closest('#btn-open-customer-modal')) {
        customerController.view.showRegisterModal();
    }
    if (e.target.closest('#btn-open-sale-modal')) {
        const customers = await customerModel.getAll();
        const products = await inventoryModel.getAllProducts();
        saleController.view.showRegisterModal(customers, products);
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 992) overlay.classList.remove('active');
});

// Carga inicial: Mostra o estoque automaticamente ao abrir o sistema
inventoryController.showInventory();