# Recomendações de Segurança - Fagundes Moto Peças

## Resumo da Estrutura Atual

**Backend:** Node.js + Express com autenticação JWT, helmet, CORS configurado, SQLite com queries parametrizadas.

**Frontend:** Vanilla JS com módulos ES6, autenticação via Bearer token armazenado em localStorage.

---

## Problemas Críticos

### 1. XSS (Cross-Site Scripting) em Múltiplas Views
**Arquivos:** `public/js/InventoryView.js`, `CustomerView.js`, `NFEntryView.js`, `SaleHistoryView.js`, `SaleView.js`, `DashboardView.js`

**Problema:** Uso de `innerHTML` com template literals interpolando dados do banco sem sanitização. Exemplo em `InventoryView.js:40`:
```js
<td>${p.name}</td>
```
Se `p.name` contiver `<script>alert('xss')</script>`, o script será executado.

**Solução:** Substituir `innerHTML` por métodos seguros como `textContent` ou `createElement` + `appendChild`, ou usar uma função de escape de HTML (ex: `escapeHtml(str)` que converte `<>&"'` para entidades).

---

## Problemas Altos

### 2. Token JWT em localStorage
**Arquivo:** `public/js/AuthModel.js`

**Problema:** O token JWT é armazenado em `localStorage`, tornando-o acessível a qualquer script na mesma origem. Se um XSS for explorado, o token pode ser roubado.

**Solução:** Usar cookies `httpOnly` e `secure` para armazenar o token JWT, ou implementar refresh tokens com curta duração.

### 3. Ausência de Sanitização Backend
**Arquivo:** `js/server.js`

**Problema:** Os dados recebidos em `req.body` (nome do produto, cliente, etc.) são armazenados diretamente no banco sem qualquer sanitização. Isso perpetua o XSS.

**Solução:** Sanitizar ou validar entradas textuais no backend. Instalar e usar `validator.js` ou `DOMPurify` no backend para limpar strings.

### 4. Ausência de Rate Limiting
**Arquivo:** `js/server.js`

**Problema:** As rotas de login (`POST /api/auth/login`) e registro (`POST /api/auth/register`) não têm limite de tentativas, permitindo ataques de força bruta.

**Solução:** Implementar `express-rate-limit` nas rotas de autenticação.

---

## Problemas Médios

### 5. CSP com `'unsafe-inline'`
**Arquivo:** `js/server.js:84`

**Problema:** A política de segurança de conteúdo permite `'unsafe-inline'` para scripts, o que enfraquece a proteção contra XSS.

**Solução:** Remover `'unsafe-inline'` e usar nonces ou hashes para scripts inline.

### 6. Bloqueio de Arquivos Sensíveis Frágil
**Arquivo:** `js/server.js:583-589`

**Problema:** O middleware verifica `req.url.includes(file)`, que pode ser contornado com URL encoding ou path traversal.

**Solução:** Usar `path.resolve` e verificar se o caminho real do arquivo está dentro de `PUBLIC_DIR`.

### 7. Transação de Venda com Race Condition
**Arquivo:** `js/server.js:381-416`

**Problema:** A flag `hasError` é definida em callback mas verificada síncronamente. O `forEach` com `db.run` não espera cada callback.

**Solução:** Usar `async/await` com wrapper de promise para SQLite, ou serializar as operações corretamente dentro da transação.

### 8. Encerramento do Servidor sem Restrição de Papel
**Arquivo:** `js/server.js:572-577`

**Problema:** Qualquer usuário autenticado pode encerrar o servidor via `POST /api/system/shutdown`.

**Solução:** Restringir a rota para um papel de administrador ou bloquear em produção.

### 9. Vazamento de Informação no Registro
**Arquivo:** `js/server.js:518`

**Problema:** A mensagem "Este e-mail já está cadastrado" revela se um email está registrado no sistema.

**Solução:** Retornar uma mensagem genérica como "E-mail ou senha inválidos" no registro também, ou usar confirmação por email.

### 10. Sem Limite de Tamanho do Body
**Arquivo:** `js/server.js:99`

**Problema:** `express.json()` não tem limite configurado, permitindo DoS via payloads grandes.

**Solução:** Adicionar `express.json({ limit: '1mb' })`.

---

## Problemas Baixos

### 11. Token sem Expiração no Frontend
**Arquivo:** `public/js/AuthModel.js`

**Problema:** O token com validade de 8h no servidor fica indefinidamente no `localStorage` no frontend.

**Solução:** Verificar a expiração do token no frontend e remover se expirado, ou renovar automaticamente.

### 12. Banco SQLite na Raiz do Projeto
**Arquivo:** `js/server.js:16`

**Problema:** O banco de dados fica na raiz do projeto. Embora haja bloqueio, está vulnerável a mau config.

**Solução:** Mover para fora da pasta `public/` e garantir permissões restritas.

---

## Recomendações Adicionais

### 13. Logs de Auditoria
Implementar logging de ações sensíveis (alteração de estoque, exclusão de produtos, etc.) com timestamp e email do usuário.

### 14. Validação Melhor de Senhas no Backend
Adicionar validação de força de senha também no servidor, não apenas no cliente.

### 15. HTTPS Obrigatório em Produção
Forçar HTTPS em produção, redirecionando HTTP para HTTPS. Configure certificados SSL reais.

### 16. Testes de Segurança
Adicionar testes automatizados para as rotas sensíveis, verificando que requisições sem token são rejeitadas (401).

---

## Resumo de Prioridades

| Prioridade | Item |
|------------|------|
| 🔴 Crítico | XSS via innerHTML em todas as Views |
| 🔴 Crítico | Token JWT em localStorage |
| 🟠 Alto | Falta de sanitização backend |
| 🟠 Alto | Falta de rate limiting |
| 🟡 Médio | CSP com unsafe-inline |
| 🟡 Médio | Bloqueio de arquivos frágil |
| 🟡 Médio | Race condition em transações |
| 🟡 Médio | Shutdown sem restrição |
| 🟢 Baixo | Vazamento de email |
| 🟢 Baixo | Body sem limite de tamanho |
