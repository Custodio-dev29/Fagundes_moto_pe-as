const https = require('https');
const http = require('http');
const crypto = require('crypto');
const forge = require('node-forge');
const path = require('path');
const fs = require('fs');

const WS_URLS = {
    SP: {
        1: 'https://nfce.fazenda.sp.gov.br/NFCeWS/services/NFeAutorizacao',
        2: 'https://homologacao.nfce.fazenda.sp.gov.br/NFCeWS/services/NFeAutorizacao',
    },
    MG: {
        1: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao',
        2: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao',
    },
    RJ: {
        1: 'https://nfce.fazenda.rj.gov.br/nfce/services/NFeAutorizacao',
        2: 'https://nfce-homologacao.fazenda.rj.gov.br/nfce/services/NFeAutorizacao',
    },
    PR: {
        1: 'https://nfce.sefa.pr.gov.br/nfce/NFeAutorizacao',
        2: 'https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeAutorizacao',
    },
    RS: {
        1: 'https://nfe.sefazrs.rs.gov.br/ws/nfeautorizacao/NFeAutorizacao.asmx',
        2: 'https://nfe-homologacao.sefazrs.rs.gov.br/ws/nfeautorizacao/NFeAutorizacao.asmx',
    },
    SC: {
        1: 'https://nfe.svrs.rs.gov.br/ws/nfeautorizacao/NFeAutorizacao.asmx',
        2: 'https://nfe-homologacao.svrs.rs.gov.br/ws/nfeautorizacao/NFeAutorizacao.asmx',
    },
    DEFAULT: {
        1: 'https://nfce.fazenda.sp.gov.br/NFCeWS/services/NFeAutorizacao',
        2: 'https://homologacao.nfce.fazenda.sp.gov.br/NFCeWS/services/NFeAutorizacao',
    },
};

class NFceTransmitter {
    constructor(certificate) {
        this.certificate = certificate;
    }

    static getUrl(uf, ambiente) {
        const byUf = WS_URLS[uf.toUpperCase()] || WS_URLS.DEFAULT;
        return byUf[ambiente] || byUf[2];
    }

    signXml(xml) {
        const privateKey = this.certificate.getPrivateKeyPem();
        if (!privateKey) throw new Error('Chave privada não disponível para assinatura.');

        const sign = crypto.createSign('sha256');
        sign.update(xml, 'utf8');
        return sign.sign(privateKey, 'base64');
    }

    async send(xml, config) {
        const uf = (config.uf || 'SP').toUpperCase();
        const ambiente = config.ambiente || 2;
        const url = NFceTransmitter.getUrl(uf, ambiente);

        const soapEnvelope = this.buildSoapEnvelope(xml, config);

        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const transport = isHttps ? https : http;

            const pfxPath = config.certPath;
            const pfxPassword = config.certPassword || '';

            const agentOptions = {
                rejectUnauthorized: false,
                keepAlive: true,
                headers: {
                    'Content-Type': 'application/soap+xml;charset=utf-8',
                    'SOAPAction': 'NFeAutorizacao',
                },
            };

            if (pfxPath && fs.existsSync(pfxPath)) {
                try {
                    const pfx = fs.readFileSync(pfxPath);
                    agentOptions.pfx = pfx;
                    agentOptions.passphrase = pfxPassword;
                } catch (e) {
                    return reject(new Error(`Erro ao carregar certificado: ${e.message}`));
                }
            }

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname,
                method: 'POST',
                rejectUnauthorized: false,
                headers: {
                    'Content-Type': 'application/soap+xml;charset=utf-8',
                    'SOAPAction': '"NFeAutorizacao"',
                    'Content-Length': Buffer.byteLength(soapEnvelope, 'utf8'),
                },
            };

            if (pfxPath && fs.existsSync(pfxPath)) {
                try {
                    const pfx = fs.readFileSync(pfxPath);
                    options.pfx = pfx;
                    options.passphrase = pfxPassword;
                } catch (e) {
                    return reject(new Error(`Erro ao carregar certificado: ${e.message}`));
                }
            }

            const req = transport.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const result = this.parseResponse(data);
                        resolve(result);
                    } catch (e) {
                        reject(new Error(`Erro ao processar resposta SEFAZ: ${e.message}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Erro na conexão com SEFAZ: ${err.message}`));
            });

            req.setTimeout(60000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição SEFAZ (60s).'));
            });

            req.write(soapEnvelope);
            req.end();
        });
    }

    buildSoapEnvelope(xml, config) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao">
${xml}
        </nfeDadosMsg>
    </soap:Body>
</soap:Envelope>`;
    }

    parseResponse(responseXml) {
        const result = {
            success: false,
            cStat: null,
            xMotivo: null,
            nProt: null,
            chNFe: null,
            dhRecbto: null,
            xml: responseXml,
        };

        const extract = (tag) => {
            const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`);
            const match = responseXml.match(regex);
            return match ? match[1].trim() : null;
        };

        result.cStat = extract('cStat');
        result.xMotivo = extract('xMotivo');
        result.nProt = extract('nProt');
        result.chNFe = extract('chNFe');
        result.dhRecbto = extract('dhRecbto');
        result.success = result.cStat === '100';

        return result;
    }

    async sendContingency(xml, config, justification) {
        const result = {
            success: true,
            contingency: true,
            cStat: '999',
            xMotivo: 'Contingência Offline',
            nProt: null,
            chNFe: null,
            dhRecbto: new Date().toISOString(),
            justification: justification || 'Problemas na comunicação com a SEFAZ',
            xml: xml,
        };

        return result;
    }
}

module.exports = NFceTransmitter;
