import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateDeboningPDF(schedule) {
    return new Promise((resolve, reject) => {
        try {
            const dateStr = schedule.scheduleDate.toISOString().split('T')[0];
            const filename = `programacao-desossa-${dateStr}.pdf`;
            const filepath = path.join('uploads', filename);

            if (!fs.existsSync('uploads')) {
                fs.mkdirSync('uploads', { recursive: true });
            }

            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margins: { top: 30, bottom: 30, left: 30, right: 30 }
            });

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Título
            doc.fontSize(18)
                .fillColor('#111')
                .font('Helvetica-Bold')
                .text('Programação de Desossa - Frizelo Frigorificos', 30, 30);

            // Info Header
            doc.fontSize(10).font('Helvetica').fillColor('#444');
            const scheduleDate = new Date(schedule.scheduleDate);
            const formattedDate = scheduleDate.toLocaleDateString('pt-BR');

            doc.text(`Data: ${formattedDate}`, 30, 55);
            doc.text(`Início Previsto: ${schedule.startTime}`, 30, 70);
            doc.text(`Status: ${schedule.status}`, 30, 85);

            // Tabela
            let y = 110;
            const contentWidth = 782; // A4 Landscape width minus margins
            const colWidths = {
                seq: 30,
                lote: 40,
                origem: 150,
                boi: 40,
                vaca: 40,
                novilha: 40,
                bubalino: 45,
                touro: 40,
                total: 45,
                pecas: 60,
                inicio: 50,
                fim: 50
            };

            // Header Tabela
            doc.rect(30, y, contentWidth, 25).fill('#1e3a8a');
            doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');

            let x = 30;
            const headers = [
                { text: '#', w: colWidths.seq },
                { text: 'Lote', w: colWidths.lote },
                { text: 'Origem / Pecuarista', w: colWidths.origem },
                { text: 'Boi', w: colWidths.boi },
                { text: 'Vaca', w: colWidths.vaca },
                { text: 'Novilha', w: colWidths.novilha },
                { text: 'Bub.', w: colWidths.bubalino },
                { text: 'Touro', w: colWidths.touro },
                { text: 'Total', w: colWidths.total },
                { text: 'Peças', w: colWidths.pecas },
                { text: 'Início', w: colWidths.inicio },
                { text: 'Fim', w: colWidths.fim }
            ];

            headers.forEach(h => {
                doc.text(h.text, x, y + 8, { width: h.w, align: 'center' });
                x += h.w;
            });

            y += 25;

            // Linhas
            doc.font('Helvetica').fontSize(8);
            (schedule.lots || []).forEach((lot, index) => {
                const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                doc.rect(30, y, contentWidth, 20).fill(bgColor);

                doc.fillColor('#333');
                x = 30;

                const totalPieces = (lot.breakdown?.boi?.traseiro || 0) + (lot.breakdown?.boi?.dianteiro || 0) + (lot.breakdown?.boi?.ponta || 0) + (lot.breakdown?.boi?.cupim || 0) +
                    (lot.breakdown?.vaca?.traseiro || 0) + (lot.breakdown?.vaca?.dianteiro || 0) + (lot.breakdown?.vaca?.ponta || 0) + (lot.breakdown?.vaca?.cupim || 0) +
                    (lot.breakdown?.novilha?.traseiro || 0) + (lot.breakdown?.novilha?.dianteiro || 0) + (lot.breakdown?.novilha?.ponta || 0) + (lot.breakdown?.novilha?.cupim || 0) +
                    (lot.breakdown?.bubalino?.traseiro || 0) + (lot.breakdown?.bubalino?.dianteiro || 0) + (lot.breakdown?.bubalino?.ponta || 0) + (lot.breakdown?.bubalino?.cupim || 0) +
                    (lot.breakdown?.touro?.traseiro || 0) + (lot.breakdown?.touro?.dianteiro || 0) + (lot.breakdown?.touro?.ponta || 0) + (lot.breakdown?.touro?.cupim || 0);

                const rowData = [
                    (index + 1).toString(),
                    lot.lotNumber.toString(),
                    lot.origin,
                    (lot.boi || 0).toString(),
                    (lot.vaca || 0).toString(),
                    (lot.novilha || 0).toString(),
                    (lot.bubalino || 0).toString(),
                    (lot.touro || 0).toString(),
                    lot.totalCarcassas.toString(),
                    totalPieces.toString(),
                    lot.startTime,
                    lot.endTime
                ];

                rowData.forEach((val, i) => {
                    doc.text(val, x, y + 6, { width: headers[i].w, align: 'center', ellipsis: true });
                    x += headers[i].w;
                });

                y += 20;

                if (y > 500) {
                    doc.addPage();
                    y = 30;
                }
            });

            // Footer
            doc.rect(30, y, contentWidth, 25).fill('#7e22ce');
            doc.fillColor('#fff').font('Helvetica-Bold');
            x = 30;
            doc.text('TOTAIS', x + 5, y + 8);
            x += colWidths.seq + colWidths.lote + colWidths.origem;

            doc.text(schedule.totalBoi.toString(), x, y + 8, { width: colWidths.boi, align: 'center' }); x += colWidths.boi;
            doc.text(schedule.totalVaca.toString(), x, y + 8, { width: colWidths.vaca, align: 'center' }); x += colWidths.vaca;
            doc.text(schedule.totalNovilha.toString(), x, y + 8, { width: colWidths.novilha, align: 'center' }); x += colWidths.novilha;
            doc.text(schedule.totalBubalino.toString(), x, y + 8, { width: colWidths.bubalino, align: 'center' }); x += colWidths.bubalino;
            doc.text(schedule.totalTouro.toString(), x, y + 8, { width: colWidths.touro, align: 'center' }); x += colWidths.touro;
            doc.text(schedule.totalCarcassas.toString(), x, y + 8, { width: colWidths.total, align: 'center' }); x += colWidths.total;

            const totalPiecesAll = (schedule.totalTraseiro || 0) + (schedule.totalDianteiro || 0) + (schedule.totalPonta || 0) + (schedule.totalCupim || 0);
            doc.text(totalPiecesAll.toString(), x, y + 8, { width: colWidths.pecas, align: 'center' }); x += colWidths.pecas;

            // Rodapé
            doc.fontSize(8).fillColor('#999').font('Helvetica');
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 30, 560, { align: 'right', width: contentWidth });

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
