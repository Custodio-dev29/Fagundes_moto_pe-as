const NFceConfig = require('./NFceConfig');

class NFceXml {

    static generate(nfData, saleItems, config) {
        const chave = this.generateChave(config, nfData);
        const dhEmi = new Date(nfData.issuanceDate || new Date()).toISOString().replace(/\.\d{3}/, '-03:00');
        const cDV = chave.slice(-1);

        const paymentMap = {
            'Dinheiro': '01',
            'Cartão de Crédito': '03',
            'Cartão de Débito': '04',
            'Credito': '03',
            'Debito': '04',
            'PIX': '10',
            'Crediário': '99',
            'Boleto': '99',
            'Outros': '99',
        };
        const tPag = paymentMap[nfData.paymentMethod] || '99';

        const itemsXml = (saleItems || []).map((item, idx) => {
            const nItem = idx + 1;
            const qty = Number(item.qty) || 1;
            const unitPrice = Number(item.unitPrice) || Number(item.subtotal) / qty || 0;
            const subtotal = Number(item.subtotal) || (qty * unitPrice);
            return `
            <det nItem="${nItem}">
                <prod>
                    <cProd>${this.escapeXml(String(item.productId || ''))}</cProd>
                    <cEAN>SEM GTIN</cEAN>
                    <xProd>${this.escapeXml(String(item.productName || 'Produto'))}</xProd>
                    <NCM>${config.ncmPadrao || '87141000'}</NCM>
                    <CFOP>${this.escapeXml(nfData.cfop || '5102')}</CFOP>
                    <uCom>UN</uCom>
                    <qCom>${qty.toFixed(4)}</qCom>
                    <vUnCom>${unitPrice.toFixed(10)}</vUnCom>
                    <vProd>${subtotal.toFixed(2)}</vProd>
                    <indTot>1</indTot>
                </prod>
                <imposto>
                    <ICMS>
                        <ICMSSN102>
                            <orig>0</orig>
                            <CSOSN>102</CSOSN>
                        </ICMSSN102>
                    </ICMS>
                    <PIS>
                        <PISOutr>
                            <CST>99</CST>
                            <vBC>0.00</vBC>
                            <pPIS>0.00</pPIS>
                            <vPIS>0.00</vPIS>
                        </PISOutr>
                    </PIS>
                    <COFINS>
                        <COFINSOutr>
                            <CST>99</CST>
                            <vBC>0.00</vBC>
                            <pCOFINS>0.00</pCOFINS>
                            <vCOFINS>0.00</vCOFINS>
                        </COFINSOutr>
                    </COFINS>
                </imposto>
            </det>`;
        }).join('\n');

        const totalValue = Number(nfData.totalValue || 0).toFixed(2);

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
    <NFe>
        <infNFe versao="4.00" Id="NFe${chave}">
            <ide>
                <cUF>${String(config.cUF || NFceConfig.getUfCode(config.uf || 'SP')).padStart(2, '0')}</cUF>
                <cNF>${chave.slice(35, 43)}</cNF>
                <natOp>${this.escapeXml(nfData.natureOperation || 'VENDA')}</natOp>
                <mod>65</mod>
                <serie>${String(config.serie || 0).padStart(3, '0')}</serie>
                <nNF>${String(nfData.nfNumber || '1').padStart(9, '0')}</nNF>
                <dhEmi>${dhEmi}</dhEmi>
                <tpNF>1</tpNF>
                <idDest>1</idDest>
                <cMunFG>${config.codMun || '3550308'}</cMunFG>
                <tpImp>4</tpImp>
                <tpEmis>1</tpEmis>
                <cDV>${cDV}</cDV>
                <tpAmb>${config.ambiente || 2}</tpAmb>
                <finNFe>1</finNFe>
                <indFinal>1</indFinal>
                <indPres>1</indPres>
                <procEmi>0</procEmi>
                <verProc>Fagundes Moto Pecas 1.0</verProc>
            </ide>
            <emit>
                <CNPJ>${this.escapeXml(config.cnpj || '00000000000000')}</CNPJ>
                <xNome>${this.escapeXml(config.razaoSocial || 'EMITENTE')}</xNome>
                <xFant>${this.escapeXml(config.nomeFantasia || config.razaoSocial || 'EMITENTE')}</xFant>
                <enderEmit>
                    <xLgr>${this.escapeXml(config.endereco || '')}</xLgr>
                    <nro>${this.escapeXml(config.numero || 'S/N')}</nro>
                    <xBairro>${this.escapeXml(config.bairro || '')}</xBairro>
                    <cMun>${config.codMun || '3550308'}</cMun>
                    <xMun>${this.escapeXml(config.cidade || 'Sao Paulo')}</xMun>
                    <UF>${config.uf || 'SP'}</UF>
                    <CEP>${(config.cep || '').replace(/\D/g, '').padStart(8, '0')}</CEP>
                    <cPais>1058</cPais>
                    <xPais>BRASIL</xPais>
                    <fone>${(config.fone || '').replace(/\D/g, '')}</fone>
                </enderEmit>
                <IE>${this.escapeXml(config.ie || '')}</IE>
                <CRT>${config.crt || 3}</CRT>
            </emit>
            <dest>
                ${(() => {
                    const doc = (nfData.customerDocument || '').replace(/\D/g, '');
                    if (doc.length === 14) return `<CNPJ>${doc}</CNPJ>`;
                    return doc.length === 11 ? `<CPF>${doc}</CPF>` : '<CPF>00000000000</CPF>';
                })()}
                <xNome>${this.escapeXml(nfData.customerName || 'CONSUMIDOR')}</xNome>
                <enderDest>
                    <xLgr>${this.escapeXml(nfData.customerAddress || '')}</xLgr>
                    <nro>S/N</nro>
                    <xBairro>${this.escapeXml(nfData.customerNeighborhood || '')}</xBairro>
                    <cMun>${nfData.customerCityCode || config.codMun || '3550308'}</cMun>
                    <xMun>${this.escapeXml(nfData.customerCity || 'Sao Paulo')}</xMun>
                    <UF>${(nfData.customerState || config.uf || 'SP').toUpperCase()}</UF>
                    <CEP>${(nfData.customerZip || '').replace(/\D/g, '').padStart(8, '0')}</CEP>
                    <cPais>1058</cPais>
                    <xPais>BRASIL</xPais>
                    <fone>${(nfData.customerPhone || '').replace(/\D/g, '')}</fone>
                </enderDest>
                <indIEDest>9</indIEDest>
            </dest>
            ${itemsXml}
            <total>
                <ICMSTot>
                    <vBC>0.00</vBC>
                    <vICMS>0.00</vICMS>
                    <vICMSDeson>0.00</vICMSDeson>
                    <vFCP>0.00</vFCP>
                    <vBCST>0.00</vBCST>
                    <vST>0.00</vST>
                    <vFCPST>0.00</vFCPST>
                    <vFCPSTRet>0.00</vFCPSTRet>
                    <vProd>${totalValue}</vProd>
                    <vFrete>0.00</vFrete>
                    <vSeg>0.00</vSeg>
                    <vDesc>0.00</vDesc>
                    <vII>0.00</vII>
                    <vIPI>0.00</vIPI>
                    <vIPIDevol>0.00</vIPIDevol>
                    <vPIS>0.00</vPIS>
                    <vCOFINS>0.00</vCOFINS>
                    <vOutro>0.00</vOutro>
                    <vNF>${totalValue}</vNF>
                </ICMSTot>
            </total>
            <transp>
                <modFrete>9</modFrete>
            </transp>
            <pag>
                <detPag>
                    <tPag>${tPag}</tPag>
                    <vPag>${totalValue}</vPag>
                </detPag>
            </pag>
            <infAdic>
                <infCpl>${this.escapeXml(nfData.natureOperation || 'Venda de mercadorias')}</infCpl>
            </infAdic>
        </infNFe>
    </NFe>
</nfeProc>`;

        return { xml, chave };
    }

    static generateChave(config, nfData) {
        const cUF = String(NFceConfig.getUfCode(config.uf || 'SP')).padStart(2, '0');
        const aaMm = new Date().toISOString().slice(2, 7).replace('-', '');
        const cnpj = (config.cnpj || '00000000000000').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
        const mod = '65';
        const serie = String(config.serie || 0).padStart(3, '0');
        const nNF = String(nfData.nfNumber || '1').padStart(9, '0');
        const tpEmis = '1';
        const cNF = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');

        const chaveSemDV = `${cUF}${aaMm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
        const cDV = this.calcularDV(chaveSemDV);

        return `${chaveSemDV}${cDV}`;
    }

    static calcularDV(chaveSemDV) {
        const multiplicadores = [2, 3, 4, 5, 6, 7, 8, 9];
        let soma = 0;
        let idx = 0;

        for (let i = chaveSemDV.length - 1; i >= 0; i--) {
            soma += parseInt(chaveSemDV[i], 10) * multiplicadores[idx % multiplicadores.length];
            idx++;
        }

        const resto = soma % 11;
        const dv = (resto < 2) ? 0 : 11 - resto;
        return String(dv);
    }

    static escapeXml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

module.exports = NFceXml;
