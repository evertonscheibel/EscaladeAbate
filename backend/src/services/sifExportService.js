import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPT = path.join(__dirname, '../scripts/export_sif_xlsm.py');
const TEMPLATE_PATH = path.join(__dirname, '../templates/BOLETIM_DE_ABATE_TEMPLATE.xlsm');

/**
 * Gera o arquivo XLSM oficial do SIF
 * @param {Object} closureData Dados do fechamento
 * @param {String} outputPath Caminho de saída
 * @returns {Promise<String>}
 */
export const generateSifXlsm = (closureData, outputPath) => {
    return new Promise((resolve, reject) => {
        // Garantir que diretório existe
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const dataJson = JSON.stringify(closureData);

        // Chamar script Python
        // Nota: 'python' ou 'python3' dependendo do ambiente
        execFile('python', [PYTHON_SCRIPT, TEMPLATE_PATH, outputPath, dataJson], (error, stdout, stderr) => {
            if (error) {
                console.error('Python Export Error:', stderr);
                return reject(new Error('Erro ao executar exportação Python: ' + stderr));
            }

            if (stdout.includes('SUCCESS')) {
                resolve(outputPath);
            } else {
                reject(new Error('Falha na exportação: ' + stdout));
            }
        });
    });
};
