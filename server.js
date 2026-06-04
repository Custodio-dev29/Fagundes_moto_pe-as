const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

const DB_PATH = './fagundes_moto_pecas.db';
const BACKUP_DIR = './backups';
let MAX_BACKUPS = 5; 
let BACKUP_INTERVAL_HOURS = 24;
let backupTimer;

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('Erro ao abrir o banco de dados:', err.message);
    else console.log('Conectado ao banco de dados SQLite.');
});

// Função para realizar o backup
const backupDatabase = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

    fs.copyFile(DB_PATH, backupPath, (err) => {
        if (err) {
            console.error('Falha ao criar backup:', err);
            return;
        }
        
        console.log(`Backup automático realizado com sucesso: ${backupPath}`);

        // Rotina de limpeza: Remove arquivos excedentes mantendo apenas os mais novos
        fs.readdir(BACKUP_DIR, (err, files) => {
            if (err) return;

            const backups = files
                .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
                .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time); // Ordena decrescente (mais recentes primeiro)

            if (backups.length > MAX_BACKUPS) {
                const filesToDelete = backups.slice(MAX_BACKUPS);
                filesToDelete.forEach(file => fs.unlink(path.join(BACKUP_DIR, file.name), () => {}));
            }
        });
    });
};

const startBackupSchedule = (hours) => {
    if (backupTimer) clearInterval(backupTimer);
    console.log(`Agendando backups para cada ${hours} horas.`);
    backupTimer = setInterval(backupDatabase, hours * 3600000);
};

app.use(cors());
app.use(express.json());

// Middleware para desativar o cache (evita ter que usar Ctrl+F5)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Criar tabelas iniciais
db.serialize(() => {
    // Ativa o suporte a chaves estrangeiras (importante para integridade)
    db.run("PRAGMA foreign_keys = ON");

    // Tabela de Produtos
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        purchasePrice REAL,
        price REAL,
        stock INTEGER,
        minStock INTEGER,
        updatedAt TEXT
    )`);

    // Tabela de Clientes
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT
    )`);

    // Tabela de Vendas
    db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER,
        productId INTEGER,
        qty INTEGER,
        unitPrice REAL,
        total REAL,
        paymentMethod TEXT,
        date TEXT,
        FOREIGN KEY(customerId) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY(productId) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE
    )`);

    // Tabela de Usuários (para substituir o localStorage do AuthModel se desejar)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password TEXT,
        createdAt TEXT
    )`);

    // Tabela de Configurações para persistência
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`, () => {
        // Carregar configurações salvas ou manter padrões
        db.get("SELECT value FROM settings WHERE key = 'maxBackups'", (err, row) => {
            if (row) MAX_BACKUPS = parseInt(row.value);
            else db.run("INSERT INTO settings (key, value) VALUES ('maxBackups', ?)", [MAX_BACKUPS.toString()]);
        });

        db.get("SELECT value FROM settings WHERE key = 'backupInterval'", (err, row) => {
            if (row) BACKUP_INTERVAL_HOURS = parseInt(row.value);
            else db.run("INSERT INTO settings (key, value) VALUES ('backupInterval', ?)", [BACKUP_INTERVAL_HOURS.toString()]);
            
            // Inicialização do ciclo de backup após carregar os dados do banco
            backupDatabase();
            startBackupSchedule(BACKUP_INTERVAL_HOURS);
        });
    });
});

// --- ROTAS DE PRODUTOS ---
app.get('/api/products', (req, res) => {
    console.log('Buscando produtos...');
    db.all("SELECT * FROM products ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const p = req.body;
    console.log('Cadastrando produto:', p);
    const sql = `INSERT INTO products (id, name, purchasePrice, price, stock, minStock, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [parseInt(p.id), p.name, p.purchasePrice, p.price, p.stock, p.minStock, new Date().toISOString()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ success: false, message: "Este código de produto já está cadastrado." });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: p.id || this.lastID });
    });
});

app.put('/api/products/:id', (req, res) => {
    const p = req.body;
    const sql = `UPDATE products SET id=?, name=?, purchasePrice=?, price=?, stock=?, minStock=?, updatedAt=? WHERE id=?`;
    db.run(sql, [parseInt(p.id), p.name, p.purchasePrice, p.price, p.stock, p.minStock, new Date().toISOString(), req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.run(`DELETE FROM products WHERE id = ?`, req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.patch('/api/products/:id/stock', (req, res) => {
    const { stock } = req.body;
    db.run(`UPDATE products SET stock = ?, updatedAt = ? WHERE id = ?`, [stock, new Date().toISOString(), req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- ROTAS DE CLIENTES ---
app.get('/api/customers', (req, res) => {
    db.all("SELECT * FROM customers ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/customers', (req, res) => {
    const { name, phone } = req.body;
    console.log('Cadastrando cliente:', name);
    db.run(`INSERT INTO customers (name, phone) VALUES (?, ?)`, [name, phone], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/customers/:id', (req, res) => {
    const { name, phone } = req.body;
    db.run(`UPDATE customers SET name = ?, phone = ? WHERE id = ?`, [name, phone, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/customers/:id', (req, res) => {
    db.run(`DELETE FROM customers WHERE id = ?`, req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- ROTAS DE VENDAS ---
app.get('/api/sales', (req, res) => {
    const sql = `
        SELECT s.*, c.name as customerName, ('#' || p.id || ' - ' || p.name) as productName 
        FROM sales s
        LEFT JOIN customers c ON s.customerId = c.id
        LEFT JOIN products p ON s.productId = p.id
        ORDER BY s.date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sales', (req, res) => {
    const s = req.body;
    console.log('Registrando venda:', s);
    const sql = `INSERT INTO sales (customerId, productId, qty, unitPrice, total, paymentMethod, date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [s.customerId, s.productId, s.qty, s.unitPrice, s.total, s.paymentMethod, new Date().toISOString()], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/sales/:id', (req, res) => {
    const s = req.body;
    const sql = `UPDATE sales SET customerId=?, productId=?, qty=?, unitPrice=?, total=?, paymentMethod=? WHERE id=?`;
    db.run(sql, [s.customerId, s.productId, s.qty, s.unitPrice, s.total, s.paymentMethod, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/sales/:id', (req, res) => {
    db.run(`DELETE FROM sales WHERE id = ?`, req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- ROTAS DE AUTENTICAÇÃO ---

// Registrar novo usuário
app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    console.log('Tentativa de registro:', email);
    if (!email || !password) return res.status(400).json({ success: false, message: "E-mail e senha são obrigatórios." });
    
    const sql = `INSERT INTO users (email, password, createdAt) VALUES (?, ?, ?)`;
    db.run(sql, [email.toLowerCase().trim(), password, new Date().toISOString()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado." });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true });
    });
});

// --- ROTAS DE CONFIGURAÇÃO ---
app.get('/api/settings', (req, res) => {
    res.json({ maxBackups: MAX_BACKUPS, backupInterval: BACKUP_INTERVAL_HOURS });
});

app.post('/api/settings', (req, res) => {
    const { maxBackups, backupInterval } = req.body;
    if (maxBackups) {
        MAX_BACKUPS = parseInt(maxBackups);
        db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('maxBackups', ?)", [MAX_BACKUPS.toString()]);
    }
    if (backupInterval) {
        BACKUP_INTERVAL_HOURS = parseInt(backupInterval);
        db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('backupInterval', ?)", [BACKUP_INTERVAL_HOURS.toString()]);
        startBackupSchedule(BACKUP_INTERVAL_HOURS);
    }
    res.json({ success: true, settings: { maxBackups: MAX_BACKUPS, backupInterval: BACKUP_INTERVAL_HOURS } });
});

// Login / Verificação de Senha
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Dados incompletos." });

    const sql = `SELECT email FROM users WHERE email = ? AND password = ?`;
    db.get(sql, [email.toLowerCase().trim(), password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, user: row });
        } else {
            res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
        }
    });
});

// Rota para silenciar o erro do favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve os arquivos da pasta atual (HTML, CSS, JS)
app.use(express.static(__dirname));

// Segurança: Se uma rota /api não existir, retorna 404 JSON (evita erro de <!DOCTYPE)
app.use('/api', (req, res) => {
    res.status(404).json({ error: "Rota de API não encontrada" });
});

// Rota para carregar o index.html como página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Sistema Fagundes Moto Peças online em: http://127.0.0.1:3000');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error('Erro: A porta 3000 já está em uso por outro programa.');
    else console.error('Erro ao iniciar o servidor:', err.message);
});