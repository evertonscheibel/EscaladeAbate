const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
    'ativos_2025-12-02.xlsx',
    'ativos_2025-12-03.xlsx',
    'teste importacao.xlsx'
];

files.forEach(file => {
    const filePath = path.join('c:/Projetos/AntgravityProjeto', file);
    if (fs.existsSync(filePath)) {
        console.log(`\n--- Analisando: ${file} ---`);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (rows.length > 0) {
            console.log('Headers encontrados:', rows[0]);
            console.log('Exemplo de dados (linha 1):', rows[1]);
        }
    } else {
        console.log(`Arquivo não encontrado: ${file}`);
    }
});
