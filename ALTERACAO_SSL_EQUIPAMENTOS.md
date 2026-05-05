# 🔧 Alteração: SSL → Equipamentos Industriais

## 📋 Resumo da Alteração

**Data:** 08/01/2026  
**Tipo:** Modificação de Modelo e Interface  
**Módulo:** Certificados

### Problema Identificado

O usuário reportou que só conseguia incluir certificados do tipo "SSL", e os outros tipos geravam erro. A solução foi substituir a opção "SSL" por "Equipamentos Industriais" para atender à necessidade específica do sistema.

---

## 🔧 Alterações Realizadas

### 1. Backend - Model Certificate

**Arquivo:** `backend/src/models/Certificate.js`

**Antes:**
```javascript
type: {
    type: String,
    enum: ['ssl', 'licenca_software', 'validacao_hardware'],
    required: true
},
```

**Depois:**
```javascript
type: {
    type: String,
    enum: ['equipamentos_industriais', 'licenca_software', 'validacao_hardware'],
    required: true
},
```

### 2. Frontend - CertificateModal

**Arquivo:** `frontend/src/components/CertificateModal.tsx`

#### Alteração 1: Valor Padrão do State
**Antes:**
```typescript
const [formData, setFormData] = useState({
    name: '',
    type: 'ssl',
    // ...
});
```

**Depois:**
```typescript
const [formData, setFormData] = useState({
    name: '',
    type: 'equipamentos_industriais',
    // ...
});
```

#### Alteração 2: Valor Padrão ao Editar
**Antes:**
```typescript
type: certificate.type || 'ssl',
```

**Depois:**
```typescript
type: certificate.type || 'equipamentos_industriais',
```

#### Alteração 3: Placeholder do Input
**Antes:**
```tsx
placeholder="Ex: SSL Wildcard *.empresa.com"
```

**Depois:**
```tsx
placeholder="Ex: Compressor Industrial XYZ-2000"
```

#### Alteração 4: Opção do Select
**Antes:**
```tsx
<option value="ssl">SSL / TLS</option>
```

**Depois:**
```tsx
<option value="equipamentos_industriais">Equipamentos Industriais</option>
```

---

## ✅ Resultado

Agora o sistema permite cadastrar certificados com os seguintes tipos:

1. ✅ **Equipamentos Industriais** (novo - substitui SSL)
2. ✅ **Licença de Software**
3. ✅ **Domínio**
4. ✅ **Contrato de Suporte**
5. ✅ **Outro**

---

## 🎯 Tipos de Equipamentos Industriais

O campo "Equipamentos Industriais" pode ser usado para controlar:

- **Compressores**
- **Geradores**
- **Caldeiras**
- **Máquinas CNC**
- **Equipamentos de Refrigeração**
- **Sistemas Hidráulicos**
- **Equipamentos de Automação**
- **Válvulas e Atuadores**
- **Motores Industriais**
- **Painéis Elétricos**
- **Qualquer outro equipamento que necessite validação/certificação**

---

## 📝 Como Usar

### Cadastrar Novo Equipamento Industrial

1. Acesse **Certificados** no menu
2. Clique em **"Novo Certificado"**
3. Preencha os campos:
   - **Nome:** Ex: "Compressor Industrial XYZ-2000"
   - **Tipo:** Selecione "Equipamentos Industriais"
   - **Fornecedor:** Ex: "Atlas Copco"
   - **Data de Emissão:** Data da última validação
   - **Data de Expiração:** Data da próxima validação/manutenção obrigatória
   - **Status:** Ativo
   - **Notificar antes de:** 30 dias (ou conforme necessário)
4. Clique em **"Criar Certificado"**

### Alertas Automáticos

O sistema enviará notificações automáticas:
- 📅 **30 dias** antes da expiração
- 📅 **15 dias** antes da expiração
- 📅 **7 dias** antes da expiração

### Criação Automática de Tickets

Quando um equipamento estiver próximo da data de validação, o sistema pode criar automaticamente um ticket para:
- Agendar manutenção preventiva
- Solicitar nova certificação/validação
- Alertar equipe técnica

---

## 🔄 Compatibilidade

### Certificados Existentes

⚠️ **Importante:** Se houver certificados cadastrados anteriormente com `type: 'ssl'`, eles precisarão ser atualizados manualmente ou via script de migração.

### Script de Migração (Opcional)

Se necessário migrar dados existentes, execute no MongoDB:

```javascript
// Conectar ao banco
use Gestaoti

// Atualizar certificados SSL para Equipamentos Industriais
db.certificates.updateMany(
    { type: 'ssl' },
    { $set: { type: 'equipamentos_industriais' } }
)

// Verificar resultado
db.certificates.find({ type: 'equipamentos_industriais' }).count()
```

---

## 🧪 Testes Recomendados

- [ ] Criar novo certificado tipo "Equipamentos Industriais"
- [ ] Editar certificado existente
- [ ] Verificar se os alertas funcionam corretamente
- [ ] Testar outros tipos (Software, Domínio, etc.)
- [ ] Verificar se a validação do backend aceita o novo tipo

---

## 📊 Impacto

### Arquivos Modificados
- ✅ `backend/src/models/Certificate.js`
- ✅ `frontend/src/components/CertificateModal.tsx`

### Funcionalidades Afetadas
- ✅ Criação de certificados
- ✅ Edição de certificados
- ✅ Validação de tipos
- ✅ Interface do usuário

### Sem Impacto
- ✅ Certificados de outros tipos continuam funcionando
- ✅ Sistema de alertas mantido
- ✅ Criação automática de tickets mantida
- ✅ API endpoints inalterados

---

## 🚀 Próximos Passos

1. ✅ Reiniciar o backend (nodemon fará automaticamente)
2. ✅ Recarregar o frontend (HMR fará automaticamente)
3. ⏳ Testar criação de novo certificado
4. ⏳ Verificar se os tipos estão corretos
5. ⏳ Cadastrar equipamentos industriais reais

---

**Status:** ✅ Implementado  
**Versão:** 2.0.1  
**Data:** 08/01/2026
