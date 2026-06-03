import { InventoryModel } from './InventoryModel.js';
import { InventoryView } from './InventoryView.js';
import { InventoryController } from './InventoryController.js';
import { AuthModel } from './AuthModel.js';

const btnToggle = document.getElementById('btn-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuInventory = document.getElementById('menu-inventory');
const menuRegisterPart = document.getElementById('menu-register-part');

const toggleSidebar = () => {
    sidebar.classList.toggle('collapsed');
    overlay.classList.toggle('active');
};

btnToggle.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Controlador único para estoque
const inventoryController = new InventoryController(
    new InventoryModel(), 
    new InventoryView(),
    new AuthModel()
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

// Delegação de evento para o botão Novo Item que agora é dinâmico na View
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-open-register-modal')) {
        inventoryController.view.showRegisterModal();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 992) overlay.classList.remove('active');
});