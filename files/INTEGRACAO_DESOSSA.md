# 🥩 Módulo de Programação de Desossa - Guia de Integração

## Visão Geral

Módulo completo para gestão da programação de desossa do frigorífico, integrado ao módulo de Escala de Abate existente.

### Funcionalidades:
- **Calendário mensal** com visão de programações por dia
- **Programação diária** com lotes de carcaças
- **Importação automática** dos lotes da escala de abate
- **Registro de produção** por corte (traseiro, dianteiro, ponta de agulha, etc.)
- **Cálculo automático** de horários com intervalos (café/almoço)
- **Controle de destino** (Mercado Interno, Exportação, Industrialização)
- **Resumo de produção** com rendimento e gráficos
- **Drag-and-drop** para reordenar lotes
- **Fluxo de status**: Rascunho → Em Produção → Fechada
- **Rastreabilidade** do abate à desossa

---

## 📁 Arquivos Novos (copiar para o projeto)

### Backend (`srcb/`)
```
srcb/models/DeboningSchedule.js      ← Model da programação diária
srcb/models/DeboningLot.js           ← Model dos lotes de desossa
srcb/controllers/deboningController.js ← Controller com toda lógica
srcb/routes/deboningRoutes.js         ← Rotas da API
```

### Frontend (`srcf/`)
```
srcf/types/deboning.ts               ← Interfaces TypeScript
srcf/services/deboningService.ts      ← Service de API
srcf/pages/DeboningCalendar.tsx       ← Página do calendário
srcf/pages/DeboningCalendar.css       ← Estilos do calendário
srcf/pages/DeboningSchedule.tsx       ← Página da programação diária
srcf/pages/DeboningSchedule.css       ← Estilos da programação
```

---

## 🔧 Alterações nos Arquivos Existentes

### 1. `srcb/server.js` — Registrar rota da API

**Adicionar import** (junto com os outros imports de rotas):
```javascript
import deboningRoutes from './routes/deboningRoutes.js';
```

**Adicionar rota** (junto com as outras rotas `app.use`):
```javascript
app.use('/api/deboning', deboningRoutes);
```

---

### 2. `srcf/App.tsx` — Adicionar rotas do frontend

**Adicionar imports:**
```tsx
import { DeboningCalendar } from './pages/DeboningCalendar';
import { DeboningSchedule } from './pages/DeboningSchedule';
```

**Adicionar rotas** (dentro do `<Routes>`, junto às rotas de slaughter):
```tsx
{/* Módulo de Desossa */}
<Route
    path="/deboning"
    element={
        <PrivateRoute roles={['admin', 'tecnico']}>
            <Layout>
                <DeboningCalendar />
            </Layout>
        </PrivateRoute>
    }
/>
<Route
    path="/deboning/schedule/:date"
    element={
        <PrivateRoute roles={['admin', 'tecnico']}>
            <Layout>
                <DeboningSchedule />
            </Layout>
        </PrivateRoute>
    }
/>
```

---

### 3. `srcf/context/ModuleContext.tsx` — Registrar módulo

**Atualizar tipo `ModuleType`:**
```tsx
export type ModuleType = 'gestao-ti' | 'gep' | 'escala-abate' | 'desossa' | 'gestao-ativos' | 'slaughter' | 'candidates' | 'job-positions' | 'tickets' | 'knowledge-base' | 'documents' | 'gatehouse' | 'noc' | null;
```

**Adicionar no `moduleNames`:**
```tsx
const moduleNames: Record<string, string> = {
    // ... existentes ...
    'desossa': 'Programação de Desossa',
};
```

---

### 4. `srcf/components/Sidebar.tsx` — Adicionar menu

**Adicionar import:**
```tsx
import { Beef } from 'lucide-react';
```

**Adicionar no `moduleMenuMap`:**
```tsx
const moduleMenuMap: Record<string, string[]> = {
    // ... existentes ...
    'desossa': [
        '/deboning'
    ],
    // Também adicionar /deboning ao escala-abate se quiser agrupar:
    'escala-abate': [
        '/slaughter', '/deboning'
    ],
};
```

**Adicionar item no menu** (no grupo 'Operação', após o item de `slaughter`):
```tsx
{ path: '/deboning', icon: Beef, label: 'Programação Desossa', roles: ['admin', 'tecnico'] },
```

---

### 5. `srcf/pages/ModuleSelector.tsx` — Adicionar card do módulo

**Adicionar import:**
```tsx
import { Beef } from 'lucide-react';
```

**Adicionar módulo no array `allModules`:**
```tsx
{
    id: 'desossa',
    name: 'Programação de Desossa',
    description: 'Gestão de desossa e produção de cortes',
    icon: <Beef size={48} />,
    color: '#d97706',
    features: ['Programação Diária', 'Registro de Produção', 'Controle de Rendimento', 'Importação do Abate'],
    landingPage: '/deboning'
},
```

---

### 6. `srcf/services/index.ts` — Exportar service

**Adicionar ao final do arquivo:**
```typescript
export { deboningService } from './deboningService';
```

---

## 🗄️ Estrutura do Banco de Dados

### Collection: `deboningschedules`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| scheduleDate | Date | Data da programação (unique) |
| slaughterSchedule | ObjectId → SlaughterSchedule | Referência ao abate |
| startTime | String (HH:mm) | Hora de início |
| status | DRAFT / IN_PROGRESS / CLOSED | Estado da programação |
| targetCarcassesPerHour | Number | Meta de carcaças/hora |
| totalCarcassas | Number | Total de carcaças programadas |
| totalBoi/Vaca/Novilha/Bubalino/Touro | Number | Totais por tipo |
| totalTraseiro/Dianteiro/Ponta/Recortes/Osso/Sebo | Number | Totais de produção (kg) |
| totalProduzidoKg | Number | Total geral produzido |
| teams | Array | Equipes programadas |
| chamberTemperature | Number | Temperatura da câmara fria |

### Collection: `deboninglots`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| schedule | ObjectId → DeboningSchedule | Referência à programação |
| slaughterLot | ObjectId → SlaughterLot | Rastreabilidade ao abate |
| origin | String | Nome do produtor/origem |
| sifNumber | String | Número SIF/corretor |
| boi/vaca/novilha/bubalino/touro | Number | Quantidades por tipo |
| totalCarcassas | Number | Total de carcaças |
| pesoMedioCarcassa | Number | Peso médio estimado (kg) |
| production | Object | Produção por corte (kg) |
| destino | Enum | MI / EXP / MI_EXP / IND |
| lotStatus | Enum | PENDENTE / EM_PROCESSO / CONCLUIDO |
| startTime / endTime | String | Horários calculados |

---

## 🔌 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/deboning/calendar?month=YYYY-MM` | Calendário mensal |
| GET | `/api/deboning/schedules/:date` | Buscar/criar programação |
| PUT | `/api/deboning/schedules/:id` | Atualizar configurações |
| GET | `/api/deboning/available-slaughter` | Abates disponíveis para import |
| POST | `/api/deboning/schedules/:id/import-slaughter/:date` | Importar do abate |
| POST | `/api/deboning/schedules/:id/lots` | Criar lote |
| PUT | `/api/deboning/lots/:id` | Atualizar lote |
| PUT | `/api/deboning/lots/:id/production` | Registrar produção |
| DELETE | `/api/deboning/lots/:id` | Excluir lote |
| POST | `/api/deboning/schedules/:id/recalculate` | Recalcular horários |
| POST | `/api/deboning/schedules/:id/reorder` | Reordenar lotes |
| POST | `/api/deboning/schedules/:id/start` | Iniciar produção |
| POST | `/api/deboning/schedules/:id/close` | Fechar programação |
| POST | `/api/deboning/schedules/:id/reopen` | Reabrir programação |
| GET | `/api/deboning/schedules/:id/production-summary` | Resumo de produção |

---

## ✅ Checklist de Deploy

- [ ] Copiar os 8 arquivos novos para os diretórios corretos
- [ ] Aplicar as 6 alterações nos arquivos existentes
- [ ] Reiniciar o servidor backend
- [ ] Rebuild do frontend
- [ ] Adicionar 'desossa' aos `allowedModules` dos usuários que precisam de acesso
- [ ] Testar criação de programação
- [ ] Testar importação do abate
- [ ] Testar registro de produção
