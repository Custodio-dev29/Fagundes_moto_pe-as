require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const https = require('https');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = express();

const ROOT_DIR = path.resolve(__dirname, '..');
let PORT = parseInt(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DB_PATH = path.isAbsolute(process.env.DB_PATH || '') ? process.env.DB_PATH : path.resolve(ROOT_DIR, process.env.DB_PATH || 'fagundes_moto_pecas.db');
const BACKUP_DIR = path.isAbsolute(process.env.BACKUP_DIR || '') ? process.env.BACKUP_DIR : path.resolve(ROOT_DIR, process.env.BACKUP_DIR || 'backups');
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'fagundes-secret-local-please-change';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH ? path.resolve(ROOT_DIR, process.env.SSL_KEY_PATH) : null;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH ? path.resolve(ROOT_DIR, process.env.SSL_CERT_PATH) : null;

if (JWT_SECRET === 'fagundes-secret-local-please-change') {
    console.warn('WARNING: JWT_SECRET is using the default development value. Set JWT_SECRET in .env before deploying to production.');
}

if (isProduction && !process.env.CORS_ORIGIN) {
    console.warn('WARNING: CORS_ORIGIN is not configured. In production, set CORS_ORIGIN in .env to the application domain.');
}

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

const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
    "script-src-elem": ["'self'", "https://cdn.jsdelivr.net"],
    "style-src": ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    "font-src": ["'self'", "https://cdnjs.cloudflare.com"],
    "img-src": ["'self'", "data:"],
    "connect-src": ["'self'"]
};

if (!isProduction) {
    cspDirectives["script-src"].push("'unsafe-inline'");
}

app.use(cors({
    origin: isProduction ? CORS_ORIGIN : '*'
}));
app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: {
        directives: cspDirectives
    },
    crossOriginEmbedderPolicy: false,
}));

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
    db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, supplier TEXT, stock INTEGER)`, (err) => {
        if (err) console.error('Erro ao verificar tabela products:', err.message);
        
        // Garante a existência das novas colunas de forma segura
        db.run("ALTER TABLE products ADD COLUMN maxStock INTEGER", (err) => {
            if (err && !err.message.includes("duplicate column name")) console.error("Erro Migração maxStock:", err.message);
        });
        db.run("ALTER TABLE products ADD COLUMN minStock INTEGER", (err) => {
            if (err && !err.message.includes("duplicate column name")) console.error("Erro Migração minStock:", err.message);
        });
        db.run("ALTER TABLE products ADD COLUMN updatedAt TEXT", (err) => {
            if (err && !err.message.includes("duplicate column name")) console.error("Erro Migração updatedAt:", err.message);
        });
    });

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
        total REAL,
        paymentMethod TEXT,
        date TEXT,
        FOREIGN KEY(customerId) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE
    )`);

    // Tabela de Itens da Venda
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saleId INTEGER,
        productId INTEGER,
        qty INTEGER,
        unitPrice REAL,
        subtotal REAL,
        FOREIGN KEY(saleId) REFERENCES sales(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY(productId) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE
    )`);

    // Tabela de Entradas de NF
    db.run(`CREATE TABLE IF NOT EXISTS nf_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nfNumber TEXT,
        productId INTEGER,
        qty INTEGER,
        totalValue REAL,
        unitPrice REAL,
        sellingPrice REAL,
        profitMargin REAL,
        date TEXT,
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

// Middleware de Autenticação usando JWT
const authenticate = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: "Acesso negado. Token ausente." });
    const token = auth.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

// --- ROTAS DE PRODUTOS ---

// Exemplo de aplicação do middleware em rotas sensíveis
app.get('/api/products', authenticate, (req, res) => {
    console.log('Buscando produtos...');
    const sql = `
        SELECT p.*, 
               COALESCE((SELECT sellingPrice FROM nf_entries WHERE productId = p.id ORDER BY date DESC LIMIT 1), 0) as sellingPrice
        FROM products p
        ORDER BY p.name ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', authenticate, (req, res) => {
    const p = req.body;
    const id = parseInt(p.id);
    const stock = parseInt(p.stock) || 0;
    const minStock = parseInt(p.minStock) || 0;
    const maxStock = parseInt(p.maxStock) || 0;

    if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: "Código do produto é obrigatório e deve ser numérico." });
    }

    const sql = `INSERT INTO products (id, name, supplier, stock, maxStock, minStock) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [id, p.name, p.supplier, stock, maxStock, minStock], function(err) {
        if (err) {
            console.error('--- ERRO NO BANCO DE DADOS ---');
            console.error('Mensagem:', err.message);
            console.error('Payload recebido:', p);
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ success: false, message: "Este código de produto já está cadastrado." });
            }
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: id || this.lastID });
    });
});

app.put('/api/products/:id', authenticate, (req, res) => {
    const p = req.body;
    const id = parseInt(p.id);
    const stock = parseInt(p.stock) || 0;
    const minStock = parseInt(p.minStock) || 0;
    const maxStock = parseInt(p.maxStock) || 0;

    const sql = `UPDATE products SET id=?, name=?, supplier=?, stock=?, maxStock=?, minStock=? WHERE id=?`;
    db.run(sql, [id, p.name, p.supplier, stock, maxStock, minStock, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/products/:id', authenticate, (req, res) => {
    db.run(`DELETE FROM products WHERE id = ?`, req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.patch('/api/products/:id/stock', authenticate, (req, res) => {
    const { stock } = req.body;
    db.run(`UPDATE products SET stock = ?, updatedAt = ? WHERE id = ?`, [stock, new Date().toISOString(), req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- ROTAS DE ENTRADA DE NF ---
app.get('/api/nf-entries', authenticate, (req, res) => {
    const sql = `
        SELECT n.*, p.name as productName, p.supplier as supplierName
        FROM nf_entries n
        LEFT JOIN products p ON n.productId = p.id
        ORDER BY n.date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/nf-entries', authenticate, (req, res) => {
    const n = req.body;
    const date = new Date().toISOString();
    const sql = `INSERT INTO nf_entries (nfNumber, productId, qty, totalValue, unitPrice, sellingPrice, profitMargin, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.serialize(() => {
        db.run(sql, [n.nfNumber, n.productId, n.qty, n.totalValue, n.unitPrice, n.sellingPrice, n.profitMargin, date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Atualiza o estoque do produto automaticamente
            db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, [n.qty, n.productId], (err) => {
                if (err) console.error("Erro ao atualizar estoque via NF:", err.message);
                res.json({ success: true, id: this.lastID });
            });
        });
    });
});

// --- ROTAS DE CLIENTES ---
app.get('/api/customers', authenticate, (req, res) => {
    db.all("SELECT * FROM customers ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/customers', authenticate, (req, res) => {
    const { name, phone } = req.body;
    console.log('Cadastrando cliente:', name);
    db.run(`INSERT INTO customers (name, phone) VALUES (?, ?)`, [name, phone], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/customers/:id', authenticate, (req, res) => {
    const { name, phone } = req.body;
    db.run(`UPDATE customers SET name = ?, phone = ? WHERE id = ?`, [name, phone, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/customers/:id', authenticate, (req, res) => {
    db.run(`DELETE FROM customers WHERE id = ?`, req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- ROTAS DE VENDAS ---
app.get('/api/sales', authenticate, (req, res) => {
    const sql = `
        SELECT s.*, c.name as customerName,
        (SELECT GROUP_CONCAT(p.name || ' (x' || si.qty || ')', ', ') 
         FROM sale_items si JOIN products p ON si.productId = p.id WHERE si.saleId = s.id) as productName
        FROM sales s
        LEFT JOIN customers c ON s.customerId = c.id
        ORDER BY s.date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/sales/:id/items', authenticate, (req, res) => {
    const sql = `
        SELECT si.*, p.name as productName 
        FROM sale_items si 
        JOIN products p ON si.productId = p.id 
        WHERE si.saleId = ?`;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sales', authenticate, (req, res) => {
    const s = req.body;
    const date = new Date().toISOString();

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const saleSql = `INSERT INTO sales (customerId, total, paymentMethod, date) VALUES (?, ?, ?, ?)`;
        db.run(saleSql, [s.customerId, s.total, s.paymentMethod, date], function(err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }

            const saleId = this.lastID;
            const itemSql = `INSERT INTO sale_items (saleId, productId, qty, unitPrice, subtotal) VALUES (?, ?, ?, ?, ?)`;
            
            let hasError = false;
            if (s.items && s.items.length > 0) {
                s.items.forEach(item => {
                    db.run(itemSql, [saleId, item.productId, item.qty, item.unitPrice, item.subtotal], (err) => {
                        if (err) hasError = true;
                    });
                });
            }

            if (hasError) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Erro ao inserir itens da venda" });
            }

            db.run("COMMIT");
            res.json({ success: true, id: saleId });
        });
    });
});

app.put('/api/sales/:id', authenticate, (req, res) => {
    const s = req.body;
    const sql = `UPDATE sales SET customerId=?, productId=?, qty=?, unitPrice=?, total=?, paymentMethod=? WHERE id=?`;
    db.run(sql, [s.customerId, s.productId, s.qty, s.unitPrice, s.total, s.paymentMethod, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/sales/:id', authenticate, (req, res) => {
    const saleId = req.params.id;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        // 1. Devolve o estoque de todos os itens da venda
        const updateStockSql = `UPDATE products SET stock = stock + (SELECT qty FROM sale_items WHERE saleId = ? AND productId = products.id) WHERE id IN (SELECT productId FROM sale_items WHERE saleId = ?)`;
        db.run(updateStockSql, [saleId, saleId], (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Erro ao estornar estoque" });
            }
            // 2. Deleta a venda (o sale_items será deletado via ON DELETE CASCADE no SQLite)
            db.run(`DELETE FROM sales WHERE id = ?`, [saleId], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }
                db.run("COMMIT");
                res.json({ success: true });
            });
        });
    });
});
// --- ROTA DE FECHAMENTO DE CAIXA ---
app.get('/api/reports/cash-closure', authenticate, (req, res) => {
    const { start, end } = req.query;
    let sql = `
        SELECT 
            paymentMethod, 
            SUM(total) as total,
            COUNT(id) as count 
        FROM sales 
        WHERE 1=1`;
    const params = [];

    if (start && end) {
        sql += ` AND date BETWEEN ? AND ?`;
        params.push(`${start}T00:00:00.000Z`, `${end}T23:59:59.999Z`);
    } else {
        const today = new Date().toISOString().split('T')[0];
        sql += ` AND date >= ? AND date <= ?`;
        params.push(`${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`);
    }
    sql += ` GROUP BY paymentMethod`;
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.get('/api/reports/top-products', authenticate, (req, res) => {
    const { start, end } = req.query;
    let sql = `
        SELECT p.name, SUM(si.qty) as totalQty 
        FROM sale_items si 
        JOIN products p ON si.productId = p.id 
        JOIN sales s ON si.saleId = s.id 
        WHERE 1=1`;
    const params = [];

    if (start && end) {
        sql += ` AND s.date BETWEEN ? AND ?`;
        params.push(`${start}T00:00:00.000Z`, `${end}T23:59:59.999Z`);
    } else {
        const today = new Date().toISOString().split('T')[0];
        sql += ` AND s.date >= ? AND s.date <= ?`;
        params.push(`${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`);
    }
    sql += ` GROUP BY p.id ORDER BY totalQty DESC LIMIT 10`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// --- ROTAS DE AUTENTICAÇÃO ---

// Registrar novo usuário
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    console.log('Tentativa de registro:', email);
    if (!email || !password) return res.status(400).json({ success: false, message: "E-mail e senha são obrigatórios." });
    
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const sql = `INSERT INTO users (email, password, createdAt) VALUES (?, ?, ?)`;
        db.run(sql, [email.toLowerCase().trim(), hashedPassword, new Date().toISOString()], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado." });
                }
                return res.status(500).json({ success: false, message: err.message });
            }
            const token = jwt.sign({ email: email.toLowerCase().trim() }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ success: true, token });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao processar o cadastro." });
    }
});

// --- ROTAS DE CONFIGURAÇÃO ---
app.get('/api/settings', authenticate, (req, res) => {
    res.json({ maxBackups: MAX_BACKUPS, backupInterval: BACKUP_INTERVAL_HOURS });
});

app.post('/api/settings', authenticate, (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Dados incompletos." });

    const sql = `SELECT email, password FROM users WHERE email = ?`;
    db.get(sql, [email.toLowerCase().trim()], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });

        bcrypt.compare(password, row.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: "Erro na autenticação." });
            if (isMatch) {
                const token = jwt.sign({ email: row.email }, JWT_SECRET, { expiresIn: '8h' });
                res.json({ success: true, user: { email: row.email }, token });
            } else {
                res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
            }
        });
    });
});

// Rota para encerrar o servidor (Shutdown)
app.post('/api/system/shutdown', authenticate, (req, res) => {
    res.json({ success: true, message: "Encerrando servidor..." });
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

// Rota para silenciar o erro do favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Bloquear acesso direto a arquivos sensíveis
app.use((req, res, next) => {
    const sensitiveFiles = ['.env', '.db', '.sqlite', 'backups'];
    if (sensitiveFiles.some(file => req.url.includes(file))) {
        return res.status(403).json({ error: "Acesso proibido" });
    }
    next();
});

// Serve os arquivos estáticos da pasta public
app.use(express.static(PUBLIC_DIR));

// Fallback para SPA: Se a rota não for API e não for arquivo, manda para index ou main
app.get('(.*)', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Segurança: Se uma rota /api não existir, retorna 404 JSON (evita erro de <!DOCTYPE)
app.use('/api', (req, res) => {
    res.status(404).json({ error: "Rota de API não encontrada" });
});

const startServer = (port, attempts = 0) => {
    let server;

    // Tenta carregar SSL se os caminhos estiverem no .env
    if (SSL_KEY_PATH && SSL_CERT_PATH && fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
        try {
            const options = {
                key: fs.readFileSync(SSL_KEY_PATH),
                cert: fs.readFileSync(SSL_CERT_PATH)
            };
            server = https.createServer(options, app).listen(port, '0.0.0.0', () => {
                console.log(`Sistema Seguro (HTTPS) online em: https://0.0.0.0:${port}`);
            });
        } catch (e) {
            console.error("Erro ao carregar certificados SSL, iniciando em modo HTTP padrão:", e.message);
        }
    } 
    
    if (!server) {
        server = app.listen(port, '0.0.0.0', () => {
            console.log(`Sistema (HTTP) online em: http://0.0.0.0:${port}`);
        });
    }

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Erro: A porta ${port} já está em uso.`);
            if (attempts < 5) {
                const nextPort = port + 1;
                console.log(`Tentando porta alternativa ${nextPort} (tentativa ${attempts + 1})...`);
                setTimeout(() => startServer(nextPort, attempts + 1), 500);
            } else {
                console.error('Não foi possível encontrar uma porta disponível após várias tentativas.');
                process.exit(1);
            }
        } else {
            console.error('Erro ao iniciar o servidor:', err.message);
            process.exit(1);
        }
    });
};

startServer(PORT);