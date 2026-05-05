# Guia de Backup do Sistema - Gestão de TI

Este documento explica como configurar e utilizar a rotina de backup do sistema.

## 1. O que é feito no Backup?
- **Banco de Dados**: Exportação completa do MongoDB (precisa do `mongodump`).
- **Uploads**: Compactação de todos os arquivos anexados em tickets.
- **Retenção**: Exclusão automática de backups com mais de 7 dias.

## 2. Pré-requisitos (Importante)
Para o backup do Banco de Dados funcionar, você precisa instalar o **MongoDB Database Tools**:
1. Baixe em: [https://www.mongodb.com/try/download/database-tools](https://www.mongodb.com/try/download/database-tools)
2. Selecione a versão Windows x86_64 MSI.
3. Instale com as opções padrão.
4. O script tentará localizar o `mongodump.exe` automaticamente em `C:\Program Files\MongoDB\Database Tools\bin\`.

## 3. Como Executar Manualmente
Você pode rodar o backup a qualquer momento clicando com o botão direito no arquivo `c:\Projetos\AntgravityProjeto\scripts\backup_system.ps1` e selecionando **"Executar com o PowerShell"**.

## 4. Agendamento Automático (Diário)
Siga estes passos para agendar o backup diariamente às 02:00 da manhã:

1. Abra o **Agendador de Tarefas** do Windows.
2. Clique em **"Criar Tarefa Básica..."**.
3. Nome: `Backup Gestão TI`.
4. Disparador: `Diariamente`.
5. Horário: `02:00:00`.
6. Ação: `Iniciar um programa`.
7. Programa/script: `powershell.exe`
8. Adicione os argumentos:
   `-ExecutionPolicy Bypass -File "C:\Projetos\AntgravityProjeto\scripts\backup_system.ps1"`
9. Clique em **Fim**.

## 5. Localização dos Backups
Os backups são salvos em: `C:\Backups_GestaoTI`

Cada pasta terá o formato `backup_AAAAMMDD_HHMMSS`.

---

> [!NOTE]
> Se o `mongodump` não for instalado, o backup continuará funcionando para os arquivos de upload, mas exibirá um aviso de que o banco de dados foi pulado.
