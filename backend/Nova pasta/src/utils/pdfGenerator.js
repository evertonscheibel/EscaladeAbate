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
                .text('Escala de Abate - Frizelo Frigorificos', 40, 40);

            // Info Box (Data, Hora Início)
            const infoBoxX = 40;
            const infoBoxY = 70;
            const infoBoxWidth = 200;
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

            const formattedDate = schedule.slaughterDate.toLocaleDateString('pt-BR');
            drawInfoRow('Data:', formattedDate, infoBoxY);
            drawInfoRow('Hora Início:', schedule.startTime, infoBoxY + rowHeight);

            // KPI Cards - Redesenhados para caber ao lado da Info Box ou abaixo
            const cardY = 70;
            const cardHeight = 40;
            const cardWidth = 140;
            const cardGap = 10;
            const cardStartX = 250;

            const totalHeads = schedule.totalCattle;
            const predictedEnd = schedule.lots.length > 0
                ? schedule.lots[schedule.lots.length - 1].endTime
                : schedule.startTime;

            const drawSmallCard = (x, y, title, value, color) => {
                doc.rect(x, y, cardWidth, cardHeight).fill(color);
                doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold').text(title, x + 5, y + 8);
                doc.fontSize(14).text(value.toString(), x + 5, y + 20);
            };

            drawSmallCard(cardStartX, cardY, 'Total Cabeças:', totalHeads, '#3b82f6');
            drawSmallCard(cardStartX + cardWidth + cardGap, cardY, 'Fim Previsto:', predictedEnd, '#f97316');

            // Tabela
            let y = 130;
            const contentWidth = 515; // A4 Portrait width minus margins
            const colWidths = {
                pecuarista: 160,
                lote: 35,
                corretor: 70,
                boi: 35,
                vaca: 35,
                novilha: 35,
                bubalino: 35,
                total: 35,
                inicio: 37,
                fim: 38
            };

            // Header Tabela
            doc.rect(40, y, contentWidth, 25).fill('#1e3a8a');
            doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');

            let x = 40;
            doc.text('Pecuarista', x + 2, y + 8); x += colWidths.pecuarista;
            doc.text('Lote', x + 2, y + 8); x += colWidths.lote;
            doc.text('Corretor', x + 2, y + 8); x += colWidths.corretor;
            doc.text('Boi', x + 2, y + 8); x += colWidths.boi;
            doc.text('Vaca', x + 2, y + 8); x += colWidths.vaca;
            doc.text('Novilha', x + 2, y + 8); x += colWidths.novilha;
            doc.text('Bubalino', x + 2, y + 8); x += colWidths.bubalino;
            doc.text('Total', x + 2, y + 8); x += colWidths.total;
            doc.text('Início', x + 2, y + 8); x += colWidths.inicio;
            doc.text('Fim', x + 2, y + 8);

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

                doc.text(lot.lotNumber.toString(), x + 2, y + 6); x += colWidths.lote;

                // Corretor
                doc.text((lot.brokerNumber || '-').toString(), x + 2, y + 6); x += colWidths.corretor;

                doc.text((lot.boi || 0).toString(), x + 2, y + 6); x += colWidths.boi;
                doc.text((lot.vaca || 0).toString(), x + 2, y + 6); x += colWidths.vaca;
                doc.text((lot.novilha || 0).toString(), x + 2, y + 6); x += colWidths.novilha;
                doc.text((lot.bubalino || 0).toString(), x + 2, y + 6); x += colWidths.bubalino;
                doc.text(lot.total.toString(), x + 2, y + 6); x += colWidths.total;
                doc.text(lot.startTime, x + 2, y + 6); x += colWidths.inicio;
                doc.text(lot.endTime, x + 2, y + 6);

                y += 20;

                if (y > 750) {
                    doc.addPage();
                    y = 40;
                    // Header recap on new page
                    doc.rect(40, y, contentWidth, 25).fill('#1e3a8a');
                    doc.fillColor('#fff').font('Helvetica-Bold');
                    let rx = 40;
                    doc.text('Pecuarista', rx + 2, y + 8); rx += colWidths.pecuarista;
                    doc.text('Lote', rx + 2, y + 8); rx += colWidths.lote;
                    doc.text('Corretor', rx + 2, y + 8); rx += colWidths.corretor;
                    doc.text('Boi', rx + 2, y + 8); rx += colWidths.boi;
                    doc.text('Vaca', rx + 2, y + 8); rx += colWidths.vaca;
                    doc.text('Novilha', rx + 2, y + 8); rx += colWidths.novilha;
                    doc.text('Bubalino', rx + 2, y + 8); rx += colWidths.bubalino;
                    doc.text('Total', rx + 2, y + 8); rx += colWidths.total;
                    doc.text('Início', rx + 2, y + 8); rx += colWidths.inicio;
                    doc.text('Fim', rx + 2, y + 8);
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
            doc.text(schedule.totalBoi.toString(), x + 2, y + 8); x += colWidths.boi;
            doc.text(schedule.totalVaca.toString(), x + 2, y + 8); x += colWidths.vaca;
            doc.text(schedule.totalNovilha.toString(), x + 2, y + 8); x += colWidths.novilha;
            doc.text(schedule.totalBubalino.toString(), x + 2, y + 8); x += colWidths.bubalino;
            doc.text(totalHeads.toString(), x + 2, y + 8); x += colWidths.total;
            doc.text('-', x + 2, y + 8); x += colWidths.inicio;
            doc.text(predictedEnd, x + 2, y + 8);

            // Rodapé da página
            const generationTime = new Date().toLocaleString('pt-BR');
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
