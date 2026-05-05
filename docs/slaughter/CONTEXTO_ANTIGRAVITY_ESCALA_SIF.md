# CONTEXTO RÁPIDO — Escala de Abate & Fechamento SIF
# Cole como contexto de sistema no Antigravity antes de gerar blocos

## ENTIDADES E STATUS

| Entidade | Collection | Status possíveis | Fluxo |
|----------|-----------|-----------------|-------|
| SlaughterPreSchedule | slaughterpreschedules | DRAFT→ENVIADA→PUBLISHED / CANCELADA | Pré-escala por data |
| SlaughterSchedule | slaughterschedules | DRAFT→CLOSED | Escala oficial por data |
| SlaughterLot | slaughterlots | — | Lotes com horários (ref: schedule) |
| SlaughterClosure | slaughterclosures | DRAFT→CLOSED | Fechamento SIF por data |
| SlaughterVersion | slaughterversions | — | Audit trail SIF |

## CÁLCULO DE HORÁRIOS (REGRA CORE)

durationMinutes = ceil((total / rateHeadsPerHour) * 60)
startTime do lote N = endTime do lote N-1
Se startTime cai DENTRO de intervalo (café/almoço): empurra para fim do intervalo
Se intervalo ocorre DURANTE execução: adiciona sua duração ao endTime

## VALIDAÇÕES CRÍTICAS

### Fechar Escala de Abate:
- Mínimo 1 lote
- Nenhum lote com total = 0
- Gera PDF

### Fechar Fechamento SIF:
- Todas as linhas com curral, municipio, uf preenchidos
- Gera Boletim PDF + XLSM SIF

### Publicar Pré-Escala:
- Sincroniza automaticamente SlaughterSchedule + SlaughterLots
- Recalcula todos os horários a partir dos parâmetros da pré-escala

## PERMISSÕES

admin    → tudo (criar, editar, fechar, reabrir)
tecnico  → criar, editar, fechar (NÃO reabrir)
supervisor → apenas visualização

Middleware: protect → checkModule('slaughter') → authorize(roles)

## CAMPOS OBRIGATÓRIOS SIF (Fechamento)

Por linha:
- producerName (herdado da escala)
- municipio (herdado, mas editável)
- uf (herdado, mas editável)
- curral (preenchido pelo operador — baia de embarque)
- cor (cor da ficha/brinco)
- nf (número nota fiscal)
- gta (Guia de Trânsito Animal MAPA)

No header:
- sifNumber (número do estabelecimento SIF)
- slaughterDate

## BOLETIM DE ABATE (PDF)

Texto padrão:
"Sr. Chefe da IF {sifNumber}, junto ao FRIZELO FRIGORÍFICOS LTDA.
Em mãos comunicamos que pretendemos abater amanhã dia {DD/MM} os seguintes lotes:"

Tabela: LOTE | PECUARISTA | MUNICÍPIO | BOI | VACA | TOTAL | CURRAL | COR | NF
Rodapé: Totais + assinatura Médico Veterinário + Gerente Industrial

## CATEGORIAS BOVINAS

boi = macho bovino adulto inteiro
vaca = fêmea bovina adulta
novilha = fêmea bovina jovem
bubalino = búfalo
touro = macho reprodutor

## DATAS — SEMPRE UTC ZERADO

Normalização: new Date(Date.UTC(year, month-1, day))
Comparação: usar $gte/$lte com datas UTC para evitar bug de timezone
Formato nas rotas: "YYYY-MM-DD" (params e queries)

## IDEMPOTÊNCIA (Pré-Escala)

Campo lastRequestId = UUID v4 gerado no front antes de cada PUT
Permite retry seguro sem duplicar operações

## SOFT DELETE

SlaughterPreSchedule, SlaughterSchedule, SlaughterLot, SlaughterVersion:
campo deletedAt (Date, default null)
Todas as queries devem filtrar deletedAt: null (ou usar plugin)

## RECÁLCULO EM DOIS PASSOS (evita conflito unique index)

Passo 1: zerar lotNumbers para negativos (ex: -(i + 5000))
Passo 2: atribuir lotNumbers reais + calcular horários
Usar bulkWrite para performance
