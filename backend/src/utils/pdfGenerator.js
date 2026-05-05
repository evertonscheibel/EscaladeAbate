import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateSlaughterPDF(schedule) {
    return new Promise((resolve, reject) => {
        try {
            const dateStr = schedule.slaughterDate.toISOString().split('T')[0];
            const filename = `escala-${dateStr}.pdf`;
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

            // Título
            doc.fontSize(20)
                .fillColor('#111')
                .font('Helvetica-Bold')
                .text('Pré Escala de Abate - Frizelo Frigorificos', 40, 40);

            // Info Box (Data, Hora Início) - Movida para a direita
            const contentWidth = 515;
            const infoBoxWidth = 200;
            const infoBoxX = 40 + contentWidth - infoBoxWidth;
            const infoBoxY = 70;
            const rowHeight = 20;

            doc.rect(infoBoxX, infoBoxY, infoBoxWidth, rowHeight * 2)
                .strokeColor('#ccc')
                .lineWidth(1)
                .stroke();

            // Linha interna da box
            doc.moveTo(infoBoxX, infoBoxY + rowHeight).lineTo(infoBoxX + infoBoxWidth, infoBoxY + rowHeight).stroke();

            doc.fontSize(9).font('Helvetica').fillColor('#555');

            const drawInfoRow = (label, value, y) => {
                doc.font('Helvetica-Bold').text(label, infoBoxX + 10, y + 6);
                doc.font('Helvetica').text(value, infoBoxX + 70, y + 6);
            };

            // Formatar data do calendário (slaughterDate) como DD/MM/YYYY
            const scheduleDate = new Date(schedule.slaughterDate);
            const day = String(scheduleDate.getUTCDate()).padStart(2, '0');
            const month = String(scheduleDate.getUTCMonth() + 1).padStart(2, '0');
            const year = scheduleDate.getUTCFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            drawInfoRow('Data:', formattedDate, infoBoxY);
            drawInfoRow('Hora Início:', (schedule.startTime || '').slice(0, 5), infoBoxY + rowHeight);

            const totalHeads = schedule.totalCattle;
            const predictedEnd = schedule.lots.length > 0
                ? (schedule.lots[schedule.lots.length - 1].endTime || '').slice(0, 5)
                : (schedule.startTime || '').slice(0, 5);

            // Tabela
            let y = 130;
            const colWidths = {
                pecuarista: 110,
                lote: 25,
                corretor: 50,
                boi: 35,
                vaca: 35,
                novilha: 45,
                bubalino: 55,
                touro: 40,
                total: 40,
                inicio: 40,
                fim: 40
            };

            // Header Tabela
            doc.rect(40, y, contentWidth, 25).fill('#1e3a8a');
            doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');

            let x = 40;
            doc.text('Pecuarista', x + 2, y + 8); x += colWidths.pecuarista;
            doc.text('Lote', x, y + 8, { width: colWidths.lote, align: 'center' }); x += colWidths.lote;
            doc.text('Corretor', x, y + 8, { width: colWidths.corretor, align: 'center' }); x += colWidths.corretor;
            doc.text('Boi', x, y + 8, { width: colWidths.boi, align: 'center' }); x += colWidths.boi;
            doc.text('Vaca', x, y + 8, { width: colWidths.vaca, align: 'center' }); x += colWidths.vaca;
            doc.text('Novilha', x, y + 8, { width: colWidths.novilha, align: 'center' }); x += colWidths.novilha;
            doc.text('Bubalino', x, y + 8, { width: colWidths.bubalino, align: 'center' }); x += colWidths.bubalino;
            doc.text('Touro', x, y + 8, { width: colWidths.touro, align: 'center' }); x += colWidths.touro;
            doc.text('Total', x, y + 8, { width: colWidths.total, align: 'center' }); x += colWidths.total;
            doc.text('Início', x, y + 8, { width: colWidths.inicio, align: 'center' }); x += colWidths.inicio;
            doc.text('Fim', x, y + 8, { width: colWidths.fim, align: 'center' });

            y += 25;

            // Linhas
            doc.font('Helvetica').fontSize(8);
            schedule.lots.forEach((lot, index) => {
                const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                doc.rect(40, y, contentWidth, 20).fill(bgColor);

                doc.fillColor('#333');
                x = 40;
                // Pecuarista com truncamento se necessário
                const rancherName = lot.rancherName || 'Não informado';
                doc.text(rancherName, x + 2, y + 6, { width: colWidths.pecuarista - 5, ellipsis: true });
                x += colWidths.pecuarista;

                doc.text(lot.lotNumber.toString(), x, y + 6, { width: colWidths.lote, align: 'center' }); x += colWidths.lote;
                doc.text((lot.brokerNumber || '-').toString(), x, y + 6, { width: colWidths.corretor, align: 'center' }); x += colWidths.corretor;
                doc.text((lot.boi || 0).toString(), x, y + 6, { width: colWidths.boi, align: 'center' }); x += colWidths.boi;
                doc.text((lot.vaca || 0).toString(), x, y + 6, { width: colWidths.vaca, align: 'center' }); x += colWidths.vaca;
                doc.text((lot.novilha || 0).toString(), x, y + 6, { width: colWidths.novilha, align: 'center' }); x += colWidths.novilha;
                doc.text((lot.bubalino || 0).toString(), x, y + 6, { width: colWidths.bubalino, align: 'center' }); x += colWidths.bubalino;
                doc.text((lot.touro || 0).toString(), x, y + 6, { width: colWidths.touro, align: 'center' }); x += colWidths.touro;
                doc.text(lot.total.toString(), x, y + 6, { width: colWidths.total, align: 'center' }); x += colWidths.total;
                doc.text((lot.startTime || '').slice(0, 5), x, y + 6, { width: colWidths.inicio, align: 'center' }); x += colWidths.inicio;
                doc.text((lot.endTime || '').slice(0, 5), x, y + 6, { width: colWidths.fim, align: 'center' });

                y += 20;

                if (y > 750) {
                    doc.addPage();
                    y = 40;
                    // Header recap on new page
                    doc.rect(40, y, contentWidth, 25).fill('#1e3a8a');
                    doc.fillColor('#fff').font('Helvetica-Bold');
                    let rx = 40;
                    doc.text('Pecuarista', rx + 2, y + 8); rx += colWidths.pecuarista;
                    doc.text('Lote', rx, y + 8, { width: colWidths.lote, align: 'center' }); rx += colWidths.lote;
                    doc.text('Corretor', rx, y + 8, { width: colWidths.corretor, align: 'center' }); rx += colWidths.corretor;
                    doc.text('Boi', rx, y + 8, { width: colWidths.boi, align: 'center' }); rx += colWidths.boi;
                    doc.text('Vaca', rx, y + 8, { width: colWidths.vaca, align: 'center' }); rx += colWidths.vaca;
                    doc.text('Novilha', rx, y + 8, { width: colWidths.novilha, align: 'center' }); rx += colWidths.novilha;
                    doc.text('Bubalino', rx, y + 8, { width: colWidths.bubalino, align: 'center' }); rx += colWidths.bubalino;
                    doc.text('Touro', rx, y + 8, { width: colWidths.touro, align: 'center' }); rx += colWidths.touro;
                    doc.text('Total', rx, y + 8, { width: colWidths.total, align: 'center' }); rx += colWidths.total;
                    doc.text('Início', rx, y + 8, { width: colWidths.inicio, align: 'center' }); rx += colWidths.inicio;
                    doc.text('Fim', rx, y + 8, { width: colWidths.fim, align: 'center' });
                    y += 25;
                    doc.font('Helvetica').fillColor('#333');
                }
            });

            // Footer de Totais
            doc.rect(40, y, contentWidth, 25).fill('#7e22ce');
            doc.fillColor('#fff').font('Helvetica-Bold');
            x = 40;
            doc.text('TOTAIS', x + 2, y + 8);
            x += colWidths.pecuarista + colWidths.lote + colWidths.corretor;
            doc.text(schedule.totalBoi.toString(), x, y + 8, { width: colWidths.boi, align: 'center' }); x += colWidths.boi;
            doc.text(schedule.totalVaca.toString(), x, y + 8, { width: colWidths.vaca, align: 'center' }); x += colWidths.vaca;
            doc.text(schedule.totalNovilha.toString(), x, y + 8, { width: colWidths.novilha, align: 'center' }); x += colWidths.novilha;
            doc.text(schedule.totalBubalino.toString(), x, y + 8, { width: colWidths.bubalino, align: 'center' }); x += colWidths.bubalino;
            doc.text((schedule.totalTouro || 0).toString(), x, y + 8, { width: colWidths.touro, align: 'center' }); x += colWidths.touro;
            doc.text(totalHeads.toString(), x, y + 8, { width: colWidths.total, align: 'center' }); x += colWidths.total;
            doc.text('-', x, y + 8, { width: colWidths.inicio, align: 'center' }); x += colWidths.inicio;
            doc.text(predictedEnd, x, y + 8, { width: colWidths.fim, align: 'center' });

            // Rodapé da página
            const now = new Date();
            const generationTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            doc.fontSize(7).fillColor('#999').font('Helvetica');
            doc.text(`Gerado em: ${generationTime}`, 40, 780, { align: 'right', width: contentWidth });

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
