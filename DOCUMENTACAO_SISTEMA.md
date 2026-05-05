# 📘 Documentação do Sistema de Gestão Integrada (KRHONOS)

Este documento fornece uma visão geral atualizada das funcionalidades, tecnologias e estrutura do sistema.

**Data de Atualização:** 08/02/2026

| Recurso | Status |
| :--- | :--- |
| **Versão** | 1.2.0 |
| **Ambiente** | Desenvolvimento (Local) |
| **Plataforma** | Web (Responsivo) |

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma arquitetura moderna baseada em JavaScript/TypeScript fullstack.

### Frontend (Aplicação Web)
- **Framework:** [React 18](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Linguagem:** TypeScript (.tsx)
- **Estilização:** CSS Customizado & Tailwind CSS
- **Roteamento:** React Router Dom v6
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Http Client:** Axios

### Backend (API REST)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Banco de Dados:** MongoDB (via Mongoose ODM)
- **Autenticação:** JWT (JSON Web Tokens)
- **Segurança:** Bcrypt (hashing), Helmet, CORS, Rate Limiting
- **Relatórios:** PDFKit (Geração de Escalas)
- **Uploads:** Multer

---

## 🚀 Funcionalidades Implementadas

### 1. Gestão de Escala de Abate (Novo)
- **Planejamento Diário:** Criação e edição de lotes de abate com cálculo automático de horários.
- **Cálculo de Fluxo:** Definição de taxa de abate (cabeças/hora) com ajuste dinâmico da duração dos lotes.
- **Calendário Mensal:** Visão consolidada do mês com indicação de status (Rascunho/Fechada) e quantidade total de gado planejada.
- **Relatórios:** Geração de PDF profissional da escala para impressão e distribuição.
- **Sincronização:** Tratamento robusto de fuso horário para garantir precisão nas datas do calendário.

### 2. Módulo de Guaritas (Novo)
- **Controle de Acessos:** Registro completo de entrada e saída de veículos e visitantes.
- **Fluxo Operacional:** Cadastro rápido de novos veículos e pessoas integrado ao formulário de entrada.
- **Dashboard em Tempo Real:** Visualização de veículos atualmente no pátio com alertas de tempo de permanência.
- **Histórico Completo:** Consulta retroativa de movimentações com filtros avançados.

### 3. Infraestrutura de Rede (Novo)
- **Gestão de Ativos de Rede:** Cadastro e monitoramento de switches, roteadores e outros dispositivos.
- **Mapeamento de Portas:** Controle individual de portas e conexões.
- **Dashboard de Infra:** Visão técnica consolidada da saúde e disposição dos equipamentos de rede.

### 4. Cofre de Credenciais (Novo)
- **Segurança:** Armazenamento centralizado e seguro de senhas e acessos críticos.
- **Acesso Controlado:** Permissões específicas para visualização de segredos.

### 5. Gestão de Serviços (Helpdesk)
- **Abertura de Chamados:** Portal interno e Público (`/ticket/new`) para usuários sem conta.
- **Fluxo de Trabalho:** Controle de status, prioridades e categorias com sistema de comentários.
- **Métricas:** Painéis de desempenho técnico e satisfação.

### 6. Inventário de Ativos (CMDB)
- **Ciclo de Vida:** Rastreabilidade total desde a aquisição até o descarte.
- **Manutenção:** Registro de preventivas e corretivas vinculado aos ativos.

### 7. Gestão Financeira de TI
- **Aquisições:** Gestão de solicitações de compra, cotações e pedidos.
- **Fornecedores:** Base unificada de contatos e contratos.
- **Controle de Verba:** Monitoramento de orçamentos e boletos do setor.

### 8. Gestão de Conhecimento
- **Base de Conhecimento (KB):** Portal de artigos técnicos e manuais com contador de visualizações.
- **Gestão de Problemas:** Identificação de causas raízes seguindo práticas ITIL.

---

## 📥 Acesso e Credenciais

### URLs de Acesso
- **Painel Principal:** `http://localhost`
- **Registro de Entrada (Guarita):** `http://localhost/gatehouse/entry`
- **Escala de Abate:** `http://localhost/slaughter`
- **Portal Público de Chamados:** `http://localhost/ticket/new`

### Credenciais de Teste

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| **Administrador** | `admin@gestao.com` | `admin123` |
| **Portaria/Guarita** | `guarita@gestao.com` | `guarita123` |

---

## 📂 Estrutura de Diretórios

```
/
├── backend/                 # API REST (Node/Express/MongoDB)
│   ├── src/
│   │   ├── controllers/     # Lógica de Negócio (ex: slaughterController)
│   │   ├── models/          # Schemas (ex: SlaughterSchedule)
│   │   ├── routes/          # Endpoints API
│   │   └── utils/           # Helpers (ex: pdfGenerator)
│
├── frontend/                # Interface SPA (React/Vite/TS)
│   ├── src/
│   │   ├── components/      # UI Components (Modais, Sidebar)
│   │   ├── pages/           # Telas (Calendários, Dashboards)
│   │   └── services/        # Consumo de API (Axios)
│
└── DOCUMENTACAO_SISTEMA.md  # Este arquivo
```
