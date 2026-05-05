# PROMPT — Módulo: Indústria · Escala de Abate & Fechamento SIF
## Sistema: Bridge Gestão TI · Frizelo Frigoríficos

> Cole este prompt diretamente no workspace do Antigravity para gerar o módulo completo.

---

## CONTEXTO DO SISTEMA

Você está implementando o módulo **Indústria → Escala de Abate & Fechamento SIF** do sistema Bridge Gestão TI, usado por um frigorífico com inspeção federal (SIF/MAPA). O módulo gerencia o ciclo completo de planejamento e registro oficial do abate bovino: pré-escala → escala de abate → fechamento SIF.

**Stack backend já existente:** Node.js + Express + MongoDB (Mongoose), autenticação JWT via middleware `protect` + `authorize` + `checkModule`.

**Stack frontend já existente:** React + TypeScript + CSS Modules, contexto de autenticação via `AuthContext`, serviços HTTP via `fetch` com token Bearer.

---

## VISÃO GERAL DO MÓDULO

O módulo é dividido em **3 sub-módulos** que seguem um fluxo sequencial obrigatório:

```
[1] PRÉ-ESCALA         →  [2] ESCALA DE ABATE     →  [3] FECHAMENTO SIF
    (planejamento)            (programação oficial)        (registro regulatório)
    DRAFT→ENVIADA             DRAFT→CLOSED                 DRAFT→CLOSED
    →PUBLISHED                                             (com validação SIF)
```

---

## [1] PRÉ-ESCALA DE ABATE

### Regras de Negócio

1. **Uma pré-escala por data** (unique index em `date`, UTC zerado).
2. **Criação automática:** ao acessar uma data sem pré-escala, o sistema cria uma com status `DRAFT`.
3. **Status:**
   - `DRAFT` → editável por qualquer usuário autorizado
   - `ENVIADA` → enviada ao SIF, apenas admin pode editar
   - `PUBLISHED` → publicada internamente, dispara sincronização para Escala de Abate
   - `CANCELADA` → cancelada, sem possibilidade de edição
4. **Lotes (lots) são embutidos** no documento (embedded subdocuments). Cada lote contém:
   - `preLotRefId` (UUID gerado no front — chave de deduplificação)
   - `producerName` (nome do pecuarista) — obrigatório
   - `municipio` e `uf` (cidade/estado de origem do gado)
   - `brokerCode` e `brokerName` (corretor/intermediário)
   - Quantidades: `boi`, `vaca`, `novilha`, `bubalino`, `touro` (números inteiros ≥ 0)
   - `total` = soma automática de todas as categorias (calculado via `pre('save')`)
   - `notes` (observações livres)
5. **totalCattle** da pré-escala = soma dos totais de todos os lotes (calculado via `pre('save')`).
6. **Parâmetros de tempo:**
   - `startTime` (HH:mm, padrão: "07:00")
   - `rateHeadsPerHour` (cabeças/hora, padrão: 100)
   - `breakfastTime` (HH:mm, padrão: "08:00"), `breakfastDuration` (min, padrão: 15)
   - `lunchTime` (HH:mm, padrão: "11:00"), `lunchDuration` (min, padrão: 70)
7. **Idempotência:** campo `lastRequestId` (UUID enviado pelo front para evitar duplicatas em retry).
8. **Histórico de versões** (campo `history[]`) para auditoria SIF.
9. **Publicação** (`POST /:id/publish`) sincroniza automaticamente para a Escala de Abate:
   - Cria ou atualiza `SlaughterSchedule` para a mesma data
   - Recria todos os lotes com cálculo de horários
   - Status `ENVIADA` na pré-escala → status `CLOSED` na escala
10. **Bulk save** (`POST /bulk`) permite salvar múltiplas pré-escalas de uma vez.
11. **Soft delete** habilitado (plugin `softDeletePlugin`).

### Endpoints da Pré-Escala

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/api/slaughter/pre-schedule/calendar?month=YYYY-MM` | protect | Calendário mensal com status e totalCattle |
| GET | `/api/slaughter/pre-schedule/:date` | protect | Busca por data (cria DRAFT se não existir) |
| PUT | `/api/slaughter/pre-schedule/:id` | admin, tecnico | Atualiza pré-escala (lotes, parâmetros, status) |
| POST | `/api/slaughter/pre-schedule/:id/publish` | admin, tecnico | Publica e sincroniza para escala |
| POST | `/api/slaughter/pre-schedule/bulk` | admin, tecnico | Salva múltiplas datas de uma vez |
| GET | `/api/slaughter/pre-schedule/:id/pdf` | protect | Exporta PDF da pré-escala |

---

## [2] ESCALA DE ABATE

### Regras de Negócio

1. **Uma escala por data** (unique index em `slaughterDate`, UTC zerado).
2. **Lotes são uma coleção separada** (`SlaughterLot`), relacionados via `schedule` (ObjectId). Virtual populate com `sort: { order: 1 }`.
3. **Cálculo de horários** (função `calculateLotTiming`):
   ```
   durationMinutes = ceil((total / rateHeadsPerHour) * 60)
   startTime = endTime do lote anterior (ou startTime da escala para o 1º lote)
   
   REGRA INTERVALOS:
   - Se startTime cair DENTRO do intervalo (café/almoço): empurra início para o fim do intervalo
   - Se o intervalo ocorre DURANTE a execução do lote: adiciona duração do intervalo ao endTime
   
   endTime = startTime + durationMinutes (+ duração do intervalo se cruzar)
   ```
4. **Recálculo automático** de TODOS os lotes em sequência (`recalculateAllLots`) ocorre quando:
   - Qualquer lote é criado, atualizado ou deletado
   - Parâmetros da escala são alterados: `startTime`, `rateHeadsPerHour`, `breakfastTime`, `breakfastDuration`, `lunchTime`, `lunchDuration`
   - Lotes são reordenados
5. **Reordenação** (`POST /schedules/:id/reorder`): recebe array de IDs na nova ordem, reatribui `order` e `lotNumber` e recalcula horários.
6. **Totais desnormalizados** na escala: `totalBoi`, `totalVaca`, `totalNovilha`, `totalBubalino`, `totalTouro`, `totalCattle` — atualizados a cada mudança de lote.
7. **Fechamento** (`POST /schedules/:id/close`):
   - Requer ao menos 1 lote
   - Valida que nenhum lote tem `total = 0`
   - Recalcula todos os horários
   - Gera PDF da escala
   - Define `status: 'CLOSED'`, `closedBy`, `closedAt`, `pdfUrl`
8. **Reabertura** (`POST /schedules/:id/reopen`): apenas admin. Volta para `DRAFT`, limpa `closedBy/closedAt/pdfUrl`.
9. **Snapshot de auditoria SIF** (`createSlaughterSnapshot`) gravado em `SlaughterVersion` a cada alteração de escala ou lote.
10. **Calendário mensal** retorna escalas com totais e status; calcula `monthlySummary` apenas de escalas `CLOSED`.

### Algoritmo de Cálculo de Horários (importante para o front)

```typescript
function calculateLotTiming(lot, previousEndTime, schedule) {
  const { rateHeadsPerHour, breakfastTime, breakfastDuration, lunchTime, lunchDuration } = schedule;
  const total = lot.boi + lot.vaca + lot.novilha + lot.bubalino + lot.touro;
  const durationMinutes = Math.ceil((total / rateHeadsPerHour) * 60);
  
  let startMinutes = timeToMinutes(previousEndTime);
  
  // Se início cair dentro do café: empurra para o fim do café
  if (breakfastTime) {
    const bStart = timeToMinutes(breakfastTime);
    if (startMinutes >= bStart && startMinutes < bStart + breakfastDuration)
      startMinutes = bStart + breakfastDuration;
  }
  // Mesma lógica para almoço
  
  let endMinutes = startMinutes + durationMinutes;
  
  // Se café/almoço ocorre DURANTE o lote: adiciona duração ao endTime
  if (breakfastTime) {
    const bStart = timeToMinutes(breakfastTime);
    if (startMinutes < bStart && endMinutes > bStart) endMinutes += breakfastDuration;
  }
  // Mesma lógica para almoço
  
  return { startTime: minutesToTime(startMinutes), endTime: minutesToTime(endMinutes), durationMinutes, total };
}
```

### Endpoints da Escala

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/api/slaughter/calendar?month=YYYY-MM` | protect | Calendário mensal |
| GET | `/api/slaughter/schedules/:date` | protect | Busca por data (cria DRAFT se não existir) |
| PUT | `/api/slaughter/schedules/:id` | admin, tecnico | Atualiza parâmetros da escala |
| POST | `/api/slaughter/schedules/:scheduleId/lots` | admin, tecnico | Adiciona lote |
| PUT | `/api/slaughter/lots/:id` | admin, tecnico | Atualiza lote |
| DELETE | `/api/slaughter/lots/:id` | admin, tecnico | Remove lote |
| POST | `/api/slaughter/schedules/:id/recalculate` | admin, tecnico | Força recálculo |
| POST | `/api/slaughter/schedules/:id/reorder` | admin, tecnico | Reordena lotes `{ lotIds: string[] }` |
| POST | `/api/slaughter/schedules/:id/close` | admin, tecnico | Fecha escala |
| POST | `/api/slaughter/schedules/:id/reopen` | admin | Reabre escala |

---

## [3] FECHAMENTO SIF (Boletim de Abate)

### Regras de Negócio

1. **Pré-requisito:** Escala de Abate para a data deve estar `CLOSED`.
2. **Criação** (`POST /api/slaughter/closure/:date/from-pre`): importa lotes da escala como `lines` do fechamento. Campos `curral`, `cor`, `nf`, `gta` iniciam vazios (preenchidos pelo operador).
3. **Linha de fechamento** (closureLine) contém:
   - Dados herdados da escala: `producerName`, `municipio`, `uf`, `brokerCode`, `brokerName`, quantidades por categoria
   - Dados específicos SIF (obrigatórios para fechar): `curral` (baia de embarque), `cor` (cor da ficha/brinco), `nf` (número nota fiscal), `gta` (Guia de Trânsito Animal)
   - `observations` (livre)
   - `sequence` (ordem de abate)
4. **Validação de fechamento** (`POST /closure/:id/close`):
   - Todas as linhas devem ter `curral`, `municipio` e `uf` preenchidos
   - Retorna erro 400 listando os produtores com dados incompletos
5. **Reordenação de linhas:** array `{ order: [{ preLotRefId, sequence }] }`, ordena por `sequence` crescente.
6. **Reabertura** requer `reason` (motivo), gravado em `reopenLog[]` com `by`, `at` e `reason`.
7. **Exportação:**
   - PDF: "Boletim de Abate SIF" — header com logo + "Sr. Chefe da IF XXXX, junto ao FRIZELO FRIGORÍFICOS LTDA." + tabela de lotes + totais + assinaturas
   - XLSM: preenchimento do template oficial SIF via script Python
8. **Header do fechamento:** `sifNumber` (número do estabelecimento SIF — fixo da empresa), `veterinarian` (médico veterinário responsável), `slaughterDate`, `notes`.

### Endpoints do Fechamento

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/api/slaughter/closure/:date` | protect | Busca fechamento por data |
| POST | `/api/slaughter/closure/:date/from-pre` | admin, tecnico | Cria fechamento a partir da escala |
| PUT | `/api/slaughter/closure/:id` | admin, tecnico | Atualiza header e linhas |
| POST | `/api/slaughter/closure/:id/reorder` | admin, tecnico | Reordena linhas |
| POST | `/api/slaughter/closure/:id/close` | admin, tecnico | Valida e fecha (gera Boletim) |
| POST | `/api/slaughter/closure/:id/reopen` | admin, tecnico | Reabre com motivo |
| GET | `/api/slaughter/closure/:id/pdf` | protect | Exporta PDF Boletim de Abate |
| GET | `/api/slaughter/closure/:id/export` | protect | Exporta XLSM oficial SIF |

---

## MODELOS DE DADOS (MongoDB/Mongoose)

### SlaughterPreSchedule
```
date: Date (unique, UTC, index)
startTime: String "HH:mm" (default "07:00")
rateHeadsPerHour: Number (default 100)
status: enum ["DRAFT","ENVIADA","PUBLISHED","CANCELADA"] (default "DRAFT")
lots: [PreScheduleLot] (embedded)
  ├── preLotRefId: String (UUID, chave dedupe)
  ├── producerName: String (required)
  ├── municipio: String
  ├── uf: String (2 chars, uppercase)
  ├── brokerCode: String
  ├── brokerName: String
  ├── boi/vaca/novilha/bubalino/touro: Number (default 0)
  ├── total: Number (calculado automaticamente)
  └── notes: String
totalCattle: Number (calculado automaticamente)
breakfastTime: String (default "08:00")
breakfastDuration: Number (default 15 min)
lunchTime: String (default "11:00")
lunchDuration: Number (default 70 min)
notes: String
lastRequestId: String (UUID idempotência)
createdBy/updatedBy/publishedBy: ObjectId ref User
publishedAt: Date
version: Number (default 1)
history: [{version, updatedAt, updatedBy, snapshot, changeLog}]
timestamps: true, softDelete: true
```

### SlaughterSchedule
```
slaughterDate: Date (unique, UTC, index)
startTime: String "HH:mm" (required)
rateHeadsPerHour: Number (default 100)
status: enum ["DRAFT","CLOSED"] (default "DRAFT")
totalBoi/totalVaca/totalNovilha/totalBubalino/totalTouro: Number
totalCattle: Number
breakfastTime/breakfastDuration/lunchTime/lunchDuration: (mesmos padrões)
pdfUrl: String
notes: String
createdBy/closedBy: ObjectId ref User
closedAt: Date
virtual "lots" → SlaughterLot (sort: order ASC)
timestamps: true, softDelete: true
```

### SlaughterLot
```
schedule: ObjectId ref SlaughterSchedule (required, index)
lotNumber: Number (required, único por schedule)
rancher: ObjectId ref Rancher (opcional)
rancherName: String (required)
brokerNumber: String (required)
boi/vaca/novilha/bubalino/touro: Number (default 0)
total: Number (required, calculado automaticamente)
startTime: String "HH:mm" (calculado)
durationMinutes: Number (calculado)
endTime: String "HH:mm" (calculado)
order: Number (required)
compound index: {schedule, lotNumber} unique
timestamps: true, softDelete: true
```

### SlaughterClosure
```
date: Date (unique, UTC, index)
scheduleId: ObjectId ref SlaughterSchedule
status: enum ["DRAFT","CLOSED"] (default "DRAFT")
header:
  ├── slaughterDate: Date
  ├── sifNumber: String (default "SIF XXXX")
  ├── veterinarian: String
  └── notes: String
lines: [ClosureLine] (embedded)
  ├── sequence: Number (required)
  ├── preLotRefId: String (chave dedupe da pré-escala)
  ├── producerName: String (required)
  ├── municipio: String
  ├── uf: String (2 chars, uppercase)
  ├── brokerCode/brokerName: String
  ├── boi/vaca/novilha/bubalino/touro: Number
  ├── total: Number (calculado)
  ├── curral: String (obrigatório ao fechar)
  ├── cor: String (obrigatório ao fechar)
  ├── nf: String
  ├── gta: String
  └── observations: String
totalCattle: Number (calculado)
createdBy/updatedBy/closedBy: ObjectId ref User
closedAt: Date
reopenLog: [{by, at, reason (required)}]
timestamps: true
```

### SlaughterVersion (Auditoria SIF)
```
resourceId: ObjectId (index)
resourceType: enum ["SlaughterSchedule","SlaughterLot"]
version: Number
data: Object (snapshot completo)
changedBy: ObjectId ref User
changeReason: String
metadata: {ip, userAgent}
compound index: {resourceId, version: -1}
timestamps: true, softDelete: true
```

---

## INTERFACES DE USUÁRIO — PÁGINAS DO FRONTEND

### Tela 1: Calendário Mensal (SlaughterCalendar)
- Grade mensal (7 colunas) mostrando cada dia do mês
- Cada célula mostra: data + status badge (cor diferente por status) + total de cabeças
- Badge de status:
  - DRAFT → cinza
  - ENVIADA → amarelo
  - PUBLISHED → azul
  - CLOSED → verde
  - Vazio → nenhum badge
- Clique no dia → abre pré-escala ou escala (conforme o sub-módulo ativo)
- Navegação mês anterior/próximo com `?month=YYYY-MM`
- Painel de totais mensais (apenas dias CLOSED): Boi, Vaca, Novilha, Bubalino, Touro, Total
- Separar visualmente finais de semana
- Props: `onDayClick(date: string)`, `module: 'pre-schedule' | 'schedule' | 'closure'`

### Tela 2: Pré-Escala por Data (SlaughterSchedule)
- Header fixo:
  - Data selecionada + navegação anterior/próximo
  - Status badge com dropdown de transição
  - Parâmetros: `startTime`, `rateHeadsPerHour`, `breakfastTime`, `breakfastDuration`, `lunchTime`, `lunchDuration`
  - Botão "Publicar Pré-Escala" (quando DRAFT/ENVIADA) → chama `POST /:id/publish`
  - Botão "Exportar PDF"
- Tabela de lotes:
  - Colunas: Nº | Pecuarista | Município/UF | Corretor | Boi | Vaca | Nov | Bub | Touro | Total | Ações
  - Linha "Adicionar lote" no final com inputs inline
  - Edição inline clicando na linha
  - Botão de excluir por linha
  - Linha de totais no rodapé (soma por categoria + total geral)
- Campos por lote: `producerName*`, `municipio`, `uf` (select UF), `brokerCode`, `brokerName`, quantidades por categoria
- Auto-calcula `total` do lote na digitação
- Salvar automaticamente ao perder o foco (debounce 800ms) via `PUT /:id`

### Tela 3: Escala de Abate (SlaughterSchedule visual)
- Header: mesmos parâmetros de tempo + status
- Tabela de lotes com HORÁRIOS:
  - Colunas: Nº | Pecuarista | Corretor | Boi | Vaca | Nov | Bub | Touro | Total | Início | Duração | Fim | Ações
  - Drag-and-drop para reordenar (chama `POST /schedules/:id/reorder`)
  - Horários calculados automaticamente ao adicionar/editar lote
  - Visualização dos intervalos (café/almoço) inline na tabela como linha separada de outra cor
- Botão "Fechar Escala" (quando DRAFT com lotes)
- Botão "Reabrir" (apenas admin, quando CLOSED)
- Botão "Recalcular Horários"
- Botão "Ver PDF" (quando CLOSED)
- Indicador visual: barra de tempo linear mostrando sequência de lotes ao longo do dia

### Tela 4: Fechamento SIF (SlaughterClosure)
- Header:
  - Número SIF do estabelecimento (campo editável)
  - Médico veterinário responsável
  - Data do abate
  - Status badge
- Tabela de linhas (lotes para abate):
  - Colunas: Seq | Pecuarista | Município | UF | Boi | Vaca | Nov | Bub | Touro | Total | Curral* | Cor* | NF | GTA | Obs | Ações
  - Campos `curral`, `cor`, `nf`, `gta` editáveis inline
  - Highlight em vermelho linhas com campos obrigatórios vazios
  - Drag-and-drop para reordenar sequência
  - Atualização linha a linha via `PUT /:id` com `{ lines }`
- Botão "Iniciar Fechamento" (quando escala está CLOSED e fechamento não existe ainda)
- Botão "Fechar SIF" → valida campos, fecha, gera Boletim
- Botão "Reabrir" (admin, require motivo em modal)
- Botão "Exportar Boletim PDF"
- Botão "Exportar XLSM" (template SIF oficial)

### Tela 5: Lista de Fechamentos (SlaughterClosureList)
- Tabela com todos os fechamentos: Data | Status | Total Cabeças | Fechado por | Data Fechamento | Ações
- Filtro por mês
- Ações: Ver | Exportar PDF | Exportar XLSM | Reabrir (admin)

---

## SERVIÇOS TYPESCRIPT DO FRONTEND

```typescript
// slaughterService.ts
const API = '/api/slaughter';

export const getCalendar = (month: string) => 
  fetchAuth(`${API}/calendar?month=${month}`);

export const getScheduleByDate = (date: string) => 
  fetchAuth(`${API}/schedules/${date}`);

export const updateSchedule = (id: string, data: Partial<SlaughterSchedule>) => 
  fetchAuth(`${API}/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const createLot = (scheduleId: string, lot: Partial<SlaughterLot>) => 
  fetchAuth(`${API}/schedules/${scheduleId}/lots`, { method: 'POST', body: JSON.stringify(lot) });

export const updateLot = (id: string, lot: Partial<SlaughterLot>) => 
  fetchAuth(`${API}/lots/${id}`, { method: 'PUT', body: JSON.stringify(lot) });

export const deleteLot = (id: string) => 
  fetchAuth(`${API}/lots/${id}`, { method: 'DELETE' });

export const reorderLots = (scheduleId: string, lotIds: string[]) => 
  fetchAuth(`${API}/schedules/${scheduleId}/reorder`, { method: 'POST', body: JSON.stringify({ lotIds }) });

export const closeSchedule = (id: string) => 
  fetchAuth(`${API}/schedules/${id}/close`, { method: 'POST' });

export const reopenSchedule = (id: string) => 
  fetchAuth(`${API}/schedules/${id}/reopen`, { method: 'POST' });

// slaughterClosureService.ts
const CLOSURE_API = '/api/slaughter/closure';

export const getClosureByDate = (date: string) => 
  fetchAuth(`${CLOSURE_API}/${date}`);

export const createClosureFromSchedule = (date: string) => 
  fetchAuth(`${CLOSURE_API}/${date}/from-pre`, { method: 'POST' });

export const updateClosure = (id: string, data: Partial<SlaughterClosure>) => 
  fetchAuth(`${CLOSURE_API}/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const closeClosure = (id: string) => 
  fetchAuth(`${CLOSURE_API}/${id}/close`, { method: 'POST' });

export const reopenClosure = (id: string, reason: string) => 
  fetchAuth(`${CLOSURE_API}/${id}/reopen`, { method: 'POST', body: JSON.stringify({ reason }) });

export const exportClosurePdf = (id: string) => 
  fetchAuth(`${CLOSURE_API}/${id}/pdf`);

// preScheduleService.ts
const PRE_API = '/api/slaughter/pre-schedule';

export const getPreCalendar = (month: string) => 
  fetchAuth(`${PRE_API}/calendar?month=${month}`);

export const getPreScheduleByDate = (date: string) => 
  fetchAuth(`${PRE_API}/${date}`);

export const updatePreSchedule = (id: string, data: any) => 
  fetchAuth(`${PRE_API}/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const publishPreSchedule = (id: string) => 
  fetchAuth(`${PRE_API}/${id}/publish`, { method: 'POST' });
```

---

## PERMISSÕES (RBAC)

| Perfil | Pré-Escala | Escala | Fechamento SIF |
|--------|-----------|--------|----------------|
| admin | CRUD total + reabrir + editar PUBLISHED | CRUD total + reabrir | CRUD total + reabrir |
| tecnico (PCP) | CRUD (exceto editar PUBLISHED) | CRUD (exceto reabrir) | CRUD (exceto reabrir) |
| supervisor | Apenas visualização | Apenas visualização | Apenas visualização |
| colaborador | Sem acesso | Sem acesso | Sem acesso |

Middleware de rota: `protect` → `checkModule('slaughter')` → `authorize(perfis)`

---

## PDF — BOLETIM DE ABATE SIF (layout)

```
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO FRIZELO]          BOLETIM DE ABATE          [Data/Local] │
├─────────────────────────────────────────────────────────────────┤
│  Sr. Chefe da IF SIF-XXXX, junto ao FRIZELO FRIGORÍFICOS LTDA. │
│  Em mãos comunicamos que pretendemos abater amanhã dia DD/MM    │
│  os seguintes lotes:                                            │
├──┬──────────────────┬───────────┬────┬─────┬──────┬──────┬──┬──┤
│Lote│  PECUARISTA    │ MUNICÍPIO │BOI │VACA │TOTAL │CURRAL│COR│NF│
├──┼──────────────────┼───────────┼────┼─────┼──────┼──────┼──┼──┤
│ 1 │ João Silva       │ Terenos/MS│  5 │  3  │   8  │  B1  │Az.│001│
│ 2 │ Maria Souza      │ Campo Gr. │ 10 │  0  │  10  │  B2  │Vm.│002│
├──┴──────────────────┴───────────┼────┼─────┼──────┴──────┴──┴──┤
│                          TOTAIS │ 15 │  3  │  18                │
├─────────────────────────────────┴────┴─────┴────────────────────┤
│  Médico Veterinário: _____________ CRMV: _________              │
│  Gerente Industrial: _____________                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## INTEGRAÇÃO ENTRE MÓDULOS (FLUXO COMPLETO)

```
1. Operador cria PRÉ-ESCALA para data X
   → Adiciona lotes (pecuaristas, quantidades)
   → Status: DRAFT

2. Supervisão revisa → Status: ENVIADA

3. PCP aprova → POST /:id/publish
   → Status: PUBLISHED
   → SlaughterSchedule é criado/atualizado automaticamente
   → SlaughterLots são gerados com horários calculados

4. Escala de Abate fica disponível para o dia X
   → Usuários podem ver horários por lote
   → Ajustes finos: adicionar/remover lote, reordenar
   → Cada alteração = snapshot em SlaughterVersion

5. PCP fecha escala → POST /schedules/:id/close
   → Valida lotes
   → Gera PDF da escala
   → Status: CLOSED

6. Inspeção SIF inicia Fechamento
   → POST /closure/YYYY-MM-DD/from-pre
   → Herda lotes da escala CLOSED
   → Operador preenche: curral, cor da ficha, NF, GTA

7. Validação final → POST /closure/:id/close
   → Valida curral + municipio + uf em todos os lotes
   → Status: CLOSED
   → Gera Boletim de Abate PDF + XLSM SIF
```

---

## OBSERVAÇÕES TÉCNICAS IMPORTANTES

1. **Normalização de datas UTC:** todas as datas são normalizadas para `00:00:00.000Z` para evitar problemas de timezone. Ex: `new Date(Date.UTC(year, month-1, day))`.

2. **Recálculo em dois passos** (evita colisão de índice único `{schedule, lotNumber}`):
   - Passo 1: zera lotNumber para negativo (-5000 - índice)
   - Passo 2: atribui número final e recalcula horários

3. **preLotRefId** é a chave de vínculo entre pré-escala e fechamento SIF — deve ser preservada na sincronização.

4. **SIF XXXX** é o número fixo do estabelecimento Frizelo — deve ser configurável por variável de ambiente ou settings do sistema.

5. **GTA** = Guia de Trânsito Animal — documento obrigatório pelo MAPA para transporte de bovinos.

6. **Categorias de bovinos:** Boi (macho inteiro), Vaca (fêmea adulta), Novilha (fêmea jovem), Bubalino (búfalo), Touro (macho reprodutor). Cada categoria pode ter zero animais.

7. **Soft delete** ativo: nunca deletar fisicamente escalas ou lotes — apenas marcar `deletedAt`.

8. **Auditoria SIF:** qualquer alteração em SlaughterSchedule ou SlaughterLot deve gerar snapshot em SlaughterVersion com IP, userAgent e motivo da alteração.
