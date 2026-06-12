const forge = require('node-forge');
const fs = require('fs');

class NFceCertificate {
    constructor(pem, key) {
        this.pem = pem;
        this.key = key;
        this.cert = null;
        if (pem) {
            try { this.cert = forge.pki.certificateFromPem(pem); } catch (e) { this.cert = null; }
        }
    }

    static loadFromPfx(pfxPath, password) {
        if (!fs.existsSync(pfxPath)) {
            throw new Error(`Arquivo de certificado não encontrado: ${pfxPath}`);
        }
        const pfxData = fs.readFileSync(pfxPath);
        const p12 = forge.pkcs12.pkcs12FromAsn1(
            forge.asn1.fromDer(forge.util.createBuffer(pfxData)),
            false,
            password
        );

        let certPem = null;
        let keyPem = null;

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag });

        const allKeyBags = [
            ...(keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || []),
            ...(keyBags2[forge.pki.oids.keyBag] || []),
        ];

        if (allKeyBags.length > 0) {
            keyPem = forge.pki.privateKeyToPem(allKeyBags[0].key);
        }

        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certList = certBags[forge.pki.oids.certBag] || [];
        if (certList.length > 0) {
            certPem = forge.pki.certificateToPem(certList[0].cert);
        }

        if (!certPem || !keyPem) {
            throw new Error('Não foi possível extrair certificado e/ou chave privada do arquivo .pfx.');
        }

        return new NFceCertificate(certPem, keyPem);
    }

    static loadFromPem(certPath, keyPath) {
        const certPem = fs.readFileSync(certPath, 'utf8');
        const keyPem = fs.readFileSync(keyPath, 'utf8');
        return new NFceCertificate(certPem, keyPem);
    }

    getSubject() {
        if (!this.cert) return null;
        const parts = {};
        this.cert.subject.attributes.forEach((attr) => {
            parts[attr.name || attr.shortName] = attr.value;
        });
        return parts;
    }

    getCNPJ() {
        if (!this.cert) return null;
        const subject = this.getSubject();
        if (!subject) return null;
        for (const key of ['CNPJ', 'serialNumber']) {
            if (subject[key]) return subject[key].replace(/\D/g, '');
        }
        return null;
    }

    getCompanyName() {
        if (!this.cert) return null;
        const subject = this.getSubject();
        if (!subject) return null;
        for (const key of ['organizationName', 'O', 'OU']) {
            if (subject[key]) return subject[key];
        }
        return null;
    }

    getCNPJFromCert() {
        if (!this.cert) return null;
        try {
            const ext = this.cert.extensions.find(e => e.name === 'subjectAltName');
            if (ext && ext.altNames) {
                for (const alt of ext.altNames) {
                    if (alt.value && alt.value.includes(':')) {
                        const parts = alt.value.split(':');
                        if (parts[0].toLowerCase() === 'cnpj') {
                            return parts[1].replace(/\D/g, '');
                        }
                    }
                }
            }
        } catch (e) { }
        return this.getCNPJ();
    }

    getPublicKeyPem() {
        if (!this.cert) return null;
        return forge.pki.publicKeyToPem(this.cert.publicKey);
    }

    getPrivateKeyPem() {
        return this.key;
    }

    getCertificatePem() {
        return this.pem;
    }

    isValid() {
        if (!this.cert) return false;
        const now = new Date();
        const validFrom = this.cert.validity.notBefore;
        const validTo = this.cert.validity.notAfter;
        return now >= validFrom && now <= validTo;
    }

    getValidity() {
        if (!this.cert) return null;
        return {
            notBefore: this.cert.validity.notBefore,
            notAfter: this.cert.validity.notAfter,
        };
    }
}

module.exports = NFceCertificate;
