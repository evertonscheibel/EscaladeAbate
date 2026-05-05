# 🥩 EscaladaAbate — ERP Industrial e Gestão de Frigoríficos

Sistema ERP de alta complexidade desenvolvido para gestão verticalizada de indústrias frigoríficas, abrangendo desde a originação (compra de gado) até a expedição e controle de qualidade industrial.

![Status](https://img.shields.io/badge/status-production-success.svg)
![Node.js](https://img.shields.io/badge/node.js-v18%2B-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-enterprise-brightgreen.svg)

## 🏗️ Módulos do Sistema

### 🚜 Originação e Abate
- **Escala de Abate**: Planejamento e pré-agendamento de lotes.
- **Gestão de Pecuaristas (Ranchers)**: Cadastro e histórico de fornecedores.
- **Fechamento de Abate**: Conciliação de pesos, rendimentos e acertos financeiros.

### 🔪 Industrial e Desossa
- **Programação de Desossa**: Controle de cortes e rendimento de carcaças.
- **Gestão de Lotes**: Rastreabilidade total do lote de origem até a peça final.
- **Câmaras Frias (Cold Rooms)**: Monitoramento e gestão de estoques resfriados.

### 🧪 Qualidade e PAC (Autocontrole)
- **Programas de Autocontrole (PAC)**: Gestão de normas sanitárias e checklists.
- **Execução de Checklists**: Auditoria digital em tempo real na linha de produção.
- **Não Conformidades**: Registro e plano de ação para desvios de qualidade.

### 📊 PCP e Planejamento
- **Plano de Produção (PCP)**: Planejamento diário e ordens de produção (OP).
- **Gestão de Eventos e Paradas**: Monitoramento de eficiência industrial (OEE).

### 🛠️ Manutenção e Ativos
- **Manutenção Preventiva/Corretiva**: Gestão de ordens de serviço para máquinas.
- **Inventário de Ativos**: Controle de equipamentos industriais e rede.

### 💼 Administrativo e Suprimentos
- **Compras**: Fluxo completo de Requisição e Pedidos de Compra.
- **Financeiro**: Gestão de Boletos e Orçamentos.
- **RH/Recrutamento**: Gestão de Candidatos e Vagas.

## 🛠️ Stack Tecnológica

- **Frontend**: React.js, TypeScript, Vite.
- **Backend**: Node.js, Express.
- **Banco de Dados**: MongoDB com Mongoose (Arquitetura NoSQL para alta volumetria).
- **Automação**: Tarefas agendadas (Cron) para processamento de lotes e fechamentos.

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js 18+
- Instância do MongoDB

### Configuração

1. **Servidor**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Interface**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔐 Segurança e Rastreabilidade
- Autenticação JWT com múltiplos níveis de permissão.
- **Audit Log**: Registro detalhado de todas as alterações críticas no sistema para conformidade com normas sanitárias e fiscais.

---
Desenvolvido por **Everton Scheibel**
