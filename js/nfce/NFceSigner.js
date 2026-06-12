const forge = require('node-forge');
const { SignedXml } = require('xml-crypto');

class NFceSigner {
    constructor(certificate) {
        this.certificate = certificate;
    }

    sign(xml, chave) {
        const sig = new SignedXml(null, {
            idAttribute: 'Id',
        });

        sig.signingKey = this.certificate.getPrivateKeyPem();
        sig.keyInfoProvider = {
            getKeyInfo: (key) => {
                const certPem = this.certificate.getCertificatePem();
                const certB64 = certPem
                    .replace(/-----BEGIN CERTIFICATE-----/, '')
                    .replace(/-----END CERTIFICATE-----/, '')
                    .replace(/\n/g, '')
                    .replace(/\r/g, '')
                    .trim();
                return `<X509Data><X509Certificate>${certB64}</X509Certificate></X509Data>`;
            },
        };

        sig.addReference(
            `//*[local-name()='infNFe']`,
            [
                'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
                'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
            ],
            'http://www.w3.org/2001/04/xmlenc#sha256',
            '',
            '',
            '',
            null,
            (node) => {
                const id = node.getAttribute('Id');
                if (!id) node.setAttribute('Id', `NFe${chave}`);
                return node;
            }
        );

        sig.computeSignature(xml, {
            location: {
                reference: `//*[local-name()='infNFe']`,
                action: 'after',
            },
        });

        return sig.getSignedXml();
    }

    calculateDigestValue(xml) {
        const sha256 = forge.md.sha256.create();
        sha256.update(xml, 'utf8');
        return forge.util.encode64(sha256.digest().getBytes());
    }
}

module.exports = NFceSigner;
