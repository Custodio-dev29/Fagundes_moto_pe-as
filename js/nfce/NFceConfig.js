const path = require('path');
const fs = require('fs');

const DEFAULTS = {
    uf: 'SP',
    ambiente: 2,
    cnpj: '00000000000000',
    ie: '000000000000',
    razaoSocial: 'Fagundes Moto Pecas',
    nomeFantasia: 'Fagundes Moto Pecas',
    endereco: 'Rua Exemplo',
    numero: '0',
    bairro: 'Centro',
    cidade: 'Sao Paulo',
    codMun: '3550308',
    cep: '00000000',
    fone: '00000000000',
    crt: 3,
    certPath: '',
    serie: 0,
    ncmPadrao: '87141000',
    cnae: '4781400',
};

class NFceConfig {
    static getDefaults(db, callback) {
        const config = { ...DEFAULTS };
        if (!db) return callback(null, config);

        const keys = Object.keys(DEFAULTS);
        let pending = keys.length;
        let error = null;

        if (pending === 0) return callback(null, config);

        keys.forEach((key) => {
            db.get("SELECT value FROM settings WHERE key = ?", [`nfce_${key}`], (err, row) => {
                if (err) error = err;
                if (row) {
                    const val = row.value;
                    if (typeof DEFAULTS[key] === 'number') {
                        config[key] = parseInt(val) || DEFAULTS[key];
                    } else if (typeof DEFAULTS[key] === 'boolean') {
                        config[key] = val === 'true';
                    } else {
                        config[key] = val;
                    }
                }
                pending--;
                if (pending === 0) callback(error, config);
            });
        });
    }

    static save(db, config, callback) {
        const keys = Object.keys(DEFAULTS);
        let pending = keys.length;
        let error = null;

        keys.forEach((key) => {
            const val = config[key] !== undefined ? String(config[key]) : '';
            db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [`nfce_${key}`, val], (err) => {
                if (err) error = err;
                pending--;
                if (pending === 0) callback(error);
            });
        });
    }

    static getUfCode(uf) {
        const map = {
            'RO': 11, 'AC': 12, 'AM': 13, 'RR': 14, 'PA': 15, 'AP': 16, 'TO': 17,
            'MA': 21, 'PI': 22, 'CE': 23, 'RN': 24, 'PB': 25, 'PE': 26, 'AL': 27,
            'SE': 28, 'BA': 29, 'MG': 31, 'ES': 32, 'RJ': 33, 'SP': 35, 'PR': 41,
            'SC': 42, 'RS': 43, 'MS': 50, 'MT': 51, 'GO': 52, 'DF': 53,
        };
        return map[uf.toUpperCase()] || 35;
    }
}

module.exports = NFceConfig;
