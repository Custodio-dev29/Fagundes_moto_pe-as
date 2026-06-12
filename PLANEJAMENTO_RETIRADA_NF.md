# Planejamento: Retirada de NF (Nota Fiscal de Saída) para Vendas

## 1. Visão Geral

Atualmente o sistema possui:
- **Entrada de NF** (Compra de produtos) → já implementada
- **PDV - Vendas** (Saída de produtos) → implementada **sem emissão de NF**

**Objetivo:** Adicionar a funcionalidade de emissão de Nota Fiscal de Saída (retirada de NF) vinculada às vendas realizadas no PDV.

---

## 2. O Que Precisa Ser Feito

### 2.1. Modelo de Dados (Banco SQLite)

**Nova tabela: `nf_withdrawal`**
```sql
CREATE TABLE IF NOT EXISTS nf_withdrawal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saleId INTEGER NOT NULL UNIQUE,
    nfNumber TEXT NOT NULL,
    nfType TEXT NOT NULL DEFAULT 'NFCe',       -- NFCe (consumidor) ou NFe (empresa)
    cfop TEXT DEFAULT '5102',                  -- CFOP padrão para venda
    natureOperation TEXT DEFAULT 'Venda',      -- Natureza da operação
    customerDocument TEXT,                     -- CPF/CNPJ do cliente
    customerAddress TEXT,                      -- Endereço do cliente
    totalValue REAL NOT NULL,                  -- Valor total da NF
    issuanceDate TEXT NOT NULL,                -- Data de emissão
    status TEXT DEFAULT 'Pendente',           -- Pendente, Emitida, Cancelada
    authorizationProtocol TEXT,               -- Protocolo SEFAZ (se integração futura)
    xmlFile TEXT,                              -- Caminho/ref do XML gerado
    FOREIGN KEY(saleId) REFERENCES sales(id) ON UPDATE CASCADE ON DELETE CASCADE
);
```

**Alterações na tabela `customers`** (adicionar campos fiscais):
```sql
ALTER TABLE customers ADD COLUMN document TEXT;        -- CPF/CNPJ
ALTER TABLE customers ADD COLUMN ie TEXT;              -- Inscrição Estadual
ALTER TABLE customers ADD COLUMN address TEXT;         -- Endereço completo
ALTER TABLE customers ADD COLUMN city TEXT;            -- Cidade
ALTER TABLE customers ADD COLUMN state TEXT;           -- Estado (UF)
ALTER TABLE customers ADD COLUMN zipCode TEXT;         -- CEP
```

> **Nota:** Como SQLite não suporta ALTER TABLE de forma nativa para adicionar múltiplas colunas, essas alterações devem ser feitas no `CREATE TABLE` inicial em `server.js` ou via comandos `ALTER` no momento do upgrade.

---

### 2.2. Backend (server.js) — Novas Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/nf-withdrawal` | Lista todas as NF de saída |
| `GET` | `/api/nf-withdrawal/:id` | Detalhes de uma NF específica |
| `POST` | `/api/nf-withdrawal` | Emitir NF para uma venda existente |
| `PUT` | `/api/nf-withdrawal/:id/cancel` | Cancelar NF (alterar status) |
| `GET` | `/api/nf-withdrawal/sale/:saleId` | Buscar NF vinculada a uma venda |

**Lógica do POST (Emitir NF):**
1. Receber `saleId` e dados fiscais do cliente
2. Validar que a venda existe e não possui NF vinculada
3. Gerar número de NF (sequencial ou manual)
4. Inserir registro em `nf_withdrawal`
5. Retornar os dados da NF criada

---

### 2.3. Frontend — MVC

#### Model: `NFWithdrawalModel.js`
- `list()` → GET `/api/nf-withdrawal`
- `getById(id)` → GET `/api/nf-withdrawal/:id`
- `create(data)` → POST `/api/nf-withdrawal`
- `cancel(id)` → PUT `/api/nf-withdrawal/:id/cancel`
- `getBySale(saleId)` → GET `/api/nf-withdrawal/sale/:saleId`

#### View: `NFWithdrawalView.js`
- Tela de listagem de NF de saída (com filtros por data, cliente, status)
- Modal de emissão de NF vinculada a uma venda
- Modal de visualização/detalhes da NF
- Indicador visual no histórico de vendas (NF emitida/pendente)

#### Controller: `NFWithdrawalController.js`
- Inicializar view e model
- Ao abrir a tela de NF, carregar listagem
- Ao emitir NF: buscar dados da venda, preencher formulário, confirmar com senha
- Ao cancelar: confirmar com senha e atualizar status

#### Novo item no menu lateral:
```html
<li class="menu-item" id="menu-nf-withdrawal">
    <a href="#">
        <span class="menu-icon"><i class="fa-solid fa-file-export"></i></span>
        <span class="menu-title">Retirada de NF</span>
    </a>
</li>
```

---

### 2.4. Integração com o PDV (Vendas)

**No modal/carrinho de vendas (`SaleView.js`):**
- Após finalizar a venda, perguntar: *"Deseja emitir NF para esta venda?"*
- Se sim, abrir formulário rápido de emissão de NF
- Na tela de **Histórico de Vendas**, adicionar:
  - Coluna/ícone indicando status da NF (✅ Emitida / ⏳ Pendente / ❌ Cancelada)
  - Botão "Emitir NF" para vendas sem NF
  - Botão "Visualizar NF" para vendas com NF emitida

---

### 2.5. Fluxo Completo

```
Venda no PDV
    │
    ├─ Sem NF → Registra apenas venda normal
    │
    └─ Com NF → 
        ├─ Cliente já existe? → Usar dados fiscais salvos
        ├─ Cliente novo? → Solicitar CPF/CNPJ
        ├─ Gerar NF
        ├─ Vincular NF à venda
        └─ (Futuro) Enviar para SEFAZ
```

---

## 3. Ordem de Implementação (Prioridades)

### Fase 1 — Estrutura Básica (Prioridade: Alta)
1. [ ] Criar tabela `nf_withdrawal` no banco
2. [ ] Adicionar campos fiscais em `customers`
3. [ ] Criar rotas CRUD básicas no backend (`/api/nf-withdrawal`)
4. [ ] Criar `NFWithdrawalModel.js` (requisições API)
5. [ ] Criar `NFWithdrawalView.js` (listagem + modal emissão)
6. [ ] Criar `NFWithdrawalController.js` (lógica de controle)
7. [ ] Adicionar item no menu lateral (`main.html`)
8. [ ] Registrar controller no bootstrap (`main.js`)

### Fase 2 — Integração com Vendas (Prioridade: Alta)
9. [ ] Adicionar coluna NF no `SaleHistoryView.js` (status + ação)
10. [ ] Adicionar opção "Emitir NF" no fechamento do PDV
11. [ ] Adicionar campo CPF/CNPJ no cadastro de clientes
12. [ ] Permitir emitir NF para vendas já realizadas (sem NF)

### Fase 3 — Melhorias (Prioridade: Média)
13. [ ] Impressão do DANFE (via navegador ou PDF)
14. [ ] Numeração automática sequencial de NF
15. [ ] Relatório de NF emitidas por período
16. [ ] Cancelamento de NF (com reverter vínculo)

### Fase 4 — Futuro (Prioridade: Baixa)
17. [ ] Integração com SEFAZ (NFe/NFCe)
18. [ ] Assinatura digital (certificado A1/A3)
19. [ ] XML de transmissão
20. [ ] Contingência (offline)

---

## 4. Arquivos que Serão Modificados/Criados

### Novos Arquivos
```
public/js/NFWithdrawalModel.js
public/js/NFWithdrawalView.js
public/js/NFWithdrawalController.js
```

### Arquivos Modificados
```
js/server.js              → Nova tabela, novas rotas, campos customers
public/main.html          → Novo modal + item menu
public/js/main.js         → Registrar novo controller
public/js/SaleView.js     → Indicador NF no histórico
public/js/SaleHistoryView.js → Ação emitir NF por venda
public/js/SaleController.js → Integrar emissão pós-venda
public/css/main.css       → (se necessário) estilos adicionais
```

---

## 5. Observações Técnicas

- **Numeração NF:** Pode ser manual (usuário digita) ou automática (sequencial por ano/mês). Sugestão: iniciar com manual, evoluir para automática.
- **CFOP:** Os principais para comércio varejista: 5102 (venda), 5405 (venda p/ consumidor final), 5656 (venda fora do estado).
- **NFCe vs NFe:** NFCe é para venda a consumidor final (mais simples). NFe é para empresas. Sugestão: implementar primeiro como NFCe.
- **Validação CPF/CNPJ:** Incluir função de validação de CPF e CNPJ no frontend.
- **Segurança:** Confirmar emissão/cancelamento com senha do usuário (mesmo padrão das outras operações).

---

## 6. Sugestão de UI

### Tela de Retirada de NF
```
┌─────────────────────────────────────────────────────────┐
│  [Filtros] Nº NF: ____  Cliente: ____  Data: ____ [Buscar] │
├─────────────────────────────────────────────────────────┤
│ Nº NF │ Venda # │ Cliente │ Data │ Valor │ Status │ Ações │
│ 0001  │ #123    │ João    │ 10/06 │ 150,00│ ✅     │ [Ver] │
│ 0002  │ #125    │ Maria   │ 10/06 │ 89,00  │ ⏳     │ [Emitir]│
├─────────────────────────────────────────────────────────┤
│                                      [Total: R$ 239,00] │
└─────────────────────────────────────────────────────────┘
```

### Modal de Emissão NF
```
┌──────────────────────────────────┐
│  Emitir NF - Venda #123          │
├──────────────────────────────────┤
│  Cliente: João Silva             │
│  CPF/CNPJ: [___________]        │
│  Endereço: [___________]        │
│  Nº NF:    [___________]        │
│  CFOP:     [5102 ▼]             │
│                                  │
│  Produtos:                       │
│  ┌─────────┬────┬──────┬──────┐ │
│  │ Pneu    │ 2  │ 50,00│100,00│ │
│  │ Óleo    │ 1  │ 30,00│ 30,00│ │
│  ├─────────┴────┴──────┼──────┤ │
│  │ Total               │130,00│ │
│  └─────────────────────┴──────┘ │
│                                  │
│  Senha: [________] [Emitir NF]  │
└──────────────────────────────────┘
```

---

## 7. Próximos Passos

1. Revisar este planejamento com o usuário
2. Ajustar conforme necessário
3. Implementar Fase 1 (estrutura básica)
4. Testar cada etapa
5. Implementar Fase 2 (integração vendas)
6. Testar fluxo completo
