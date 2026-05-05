import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateClosurePDF(closure) {
    return new Promise((resolve, reject) => {
        try {
            const dateStr = closure.date.toISOString().split('T')[0];
            const filename = `boletim-sif-${dateStr}.pdf`;
            const filepath = path.join('uploads', filename);

            if (!fs.existsSync('uploads')) {
                fs.mkdirSync('uploads', { recursive: true });
            }

            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margins: { top: 40, bottom: 40, left: 40, right: 40 }
            });

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // --- DARK BLUE HEADER BANNER ---
            const primaryColor = '#1e293b';
            doc.rect(0, 0, doc.page.width, 60).fill(primaryColor);
            
            doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text('FRIZELO', 40, 22, { continued: true });
            doc.fontSize(18).font('Helvetica-Bold').text('BOLETIM DE ABATE', 0, 22, { align: 'right', indent: 40 });

            // Date and Location (below banner)
            const today = new Date();
            const dayStr = String(today.getDate()).padStart(2, '0');
            const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            const monthStr = months[today.getMonth()];
            const yearStr = today.getFullYear();

            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`Terenos-MS, ${dayStr} de ${monthStr} de ${yearStr}.`, 40, 70, { align: 'right' });
            doc.moveDown(1.5);

            // SIF Info - Formal Address
            const sifNumber = closure.header.sifNumber || 'XXXX';

            doc.fillColor('black').fontSize(11).font('Helvetica').text(`Ao Excelentíssimo Senhor,`);
            doc.fontSize(11).font('Helvetica-Bold').text(`CHEFE DA INSPEÇÃO FEDERAL`);
            doc.fontSize(11).font('Helvetica').text(`D.D. Chefe da IF SIF ${sifNumber}`);
            doc.text(`FRIZELO FRIGORÍFICOS LTDA.`);
            doc.moveDown(1.5);

            const slaughterDate = new Date(closure.date);
            const sDay = String(slaughterDate.getUTCDate()).padStart(2, '0');
            const sMonth = String(slaughterDate.getUTCMonth() + 1).padStart(2, '0');
            const sYear = slaughterDate.getUTCFullYear();

            doc.fontSize(11).font('Helvetica').text(`Prezados,`, { align: 'left' });
            doc.moveDown(0.5);
            doc.text(`Comunicamos a Vossa Senhoria que pretendemos realizar o abate no dia ${sDay}/${sMonth}/${sYear}, referente aos seguintes lotes listados abaixo:`, { align: 'justify' });
            doc.moveDown(1.5);

            // --- SUMMARY CARDS ROW ---
            const totalBoi = closure.lines.reduce((sum, l) => sum + (Number(l.boi) || 0), 0);
            const totalVaca = closure.lines.reduce((sum, l) => sum + (Number(l.vaca) || 0), 0);
            const totalHeads = closure.lines.reduce((sum, l) => sum + (Number(l.total) || 0), 0);

            let currentY = doc.y;
            doc.rect(40, currentY, 515, 45).fill('#f1f5f9');
            doc.rect(40, currentY, 515, 45).strokeColor('#cbd5e1').stroke();

            const cardWidth = 515 / 4;
            const drawCard = (label, value, x) => {
                doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(label, x, currentY + 10, { width: cardWidth, align: 'center' });
                doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text(value, x, currentY + 22, { width: cardWidth, align: 'center' });
                if (x < 40 + 515 - cardWidth) {
                    doc.moveTo(x + cardWidth, currentY + 10).lineTo(x + cardWidth, currentY + 35).strokeColor('#cbd5e1').stroke();
                }
            };

            drawCard('DATA DO ABATE', `${sDay}/${sMonth}/${sYear}`, 40);
            drawCard('TOTAL BOI', String(totalBoi), 40 + cardWidth);
            drawCard('TOTAL VACA', String(totalVaca), 40 + cardWidth * 2);
            drawCard('TOTAL CABEÇAS', String(totalHeads), 40 + cardWidth * 3);

            doc.moveDown(3);

            // --- TABLE ---
            let y = doc.y;
            const contentWidth = 515;
            const colWidths = {
                lote: 30,
                pecuarista: 165,
                municipio: 80,
                boi: 30,
                vaca: 30,
                total: 40,
                curral: 50,
                cor: 30,
                nf: 60
            };

            doc.rect(40, y, contentWidth, 22).fill(primaryColor);
            doc.fontSize(9).font('Helvetica-Bold').fillColor('white');

            let x = 40;
            const drawCellHeader = (text, width) => {
                doc.text(text, x, y + 7, { width, align: 'center' });
                x += width;
            };

            drawCellHeader('LOTE', colWidths.lote);
            drawCellHeader('PECUARISTA', colWidths.pecuarista);
            drawCellHeader('MUNICÍPIO', colWidths.municipio);
            drawCellHeader('BOI', colWidths.boi);
            drawCellHeader('VACA', colWidths.vaca);
            drawCellHeader('TOTAL', colWidths.total);
            drawCellHeader('CURRAL', colWidths.curral);
            drawCellHeader('COR', colWidths.cor);
            drawCellHeader('NF/GTA', colWidths.nf);

            y += 22;

            // Draw Rows
            doc.font('Helvetica').fontSize(8).fillColor('black');
            closure.lines.forEach((line, index) => {
                if (y > 700) {
                    doc.addPage();
                    y = 40;
                }

                // Alternate background color
                if (index % 2 === 1) {
                    doc.rect(40, y, contentWidth, 20).fill('#f8fafc');
                }
                
                doc.rect(40, y, contentWidth, 20).strokeColor('#e2e8f0').stroke();
                x = 40;

                const drawCell = (text, width, align = 'center') => {
                    const val = text !== undefined && text !== null ? String(text) : '';
                    doc.fillColor('black').text(val, x, y + 6, { width, align, ellipsis: true });
                    x += width;
                };

                drawCell(String(line.sequence).padStart(2, '0'), colWidths.lote);
                drawCell(line.producerName, colWidths.pecuarista, 'left');
                drawCell(line.municipio, colWidths.municipio, 'left');
                drawCell(line.boi || '0', colWidths.boi);
                drawCell(line.vaca || '0', colWidths.vaca);
                drawCell(line.total, colWidths.total);
                drawCell(line.curral, colWidths.curral);
                drawCell(line.cor, colWidths.cor);
                drawCell(line.nf || line.gta, colWidths.nf);

                y += 20;
            });

            // Totals Row integrated in table style
            doc.rect(40, y, contentWidth, 22).fill('#f1f5f9');
            doc.rect(40, y, contentWidth, 22).strokeColor('#cbd5e1').stroke();
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b');
            x = 40;
            doc.text('TOTAIS', x, y + 7, { width: colWidths.lote + colWidths.pecuarista + colWidths.municipio, align: 'right' });
            x += colWidths.lote + colWidths.pecuarista + colWidths.municipio;

            doc.text(String(totalBoi), x, y + 7, { width: colWidths.boi, align: 'center' }); x += colWidths.boi;
            doc.text(String(totalVaca), x, y + 7, { width: colWidths.vaca, align: 'center' }); x += colWidths.vaca;
            doc.text(String(totalHeads), x, y + 7, { width: colWidths.total, align: 'center' });

            y += 40;

            // --- OBSERVATIONS ---
            if (y > 650) { doc.addPage(); y = 40; }
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('Observações operacionais', 40, y);
            y += 15;
            doc.rect(40, y, 515, 60).strokeColor('#e2e8f0').stroke();
            doc.fontSize(8).font('Helvetica').fillColor('#64748b');
            const obsText = closure.header.notes || 'Documento estruturado para leitura rápida pela inspeção federal.\nDestaque visual para totais e dados críticos da operação.\nTabela central com melhor contraste e hierarquia das informações.';
            doc.text(obsText, 50, y + 10, { width: 495, align: 'left' });
            
            y += 100;

            // --- SIGNATURE ---
            if (y > 750) { doc.addPage(); y = 60; }
            const centerX = doc.page.width / 2;
            doc.moveTo(centerX - 100, y).lineTo(centerX + 100, y).strokeColor('#cbd5e1').stroke();
            doc.moveDown(0.5);
            doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(closure.header.veterinarian || 'MÉDICO VETERINÁRIO', 0, y + 10, { align: 'center' });
            doc.fillColor('#64748b').fontSize(9).font('Helvetica-Oblique').text('Veterinário Responsável', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(`/uploads/${filename}`);
            });

            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
}
