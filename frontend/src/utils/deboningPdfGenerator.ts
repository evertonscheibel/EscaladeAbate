// src/utils/deboningPdfGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateDeboningPDF(schedule: any) {
    const doc = new jsPDF();
    const dateFormatted = new Date(schedule.scheduleDate).toLocaleDateString('pt-BR');

    // ═══════════════════════════════════════════
    //  HEADER
    // ═══════════════════════════════════════════
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 42, 'F');
    // Faixa secundária
    doc.setFillColor(118, 75, 162);
    doc.rect(0, 38, 210, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PRÉ-ESCALA DE DESOSSA", 14, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${dateFormatted}`, 14, 28);

    const statusLabel = schedule.status === 'CLOSED' ? 'FECHADO' : schedule.status === 'IN_PROGRESS' ? 'EM PRODUÇÃO' : 'RASCUNHO';
    doc.text(`Status: ${statusLabel}`, 14, 35);

    // Logo / Empresa (direita)
    doc.setFontSize(9);
    doc.text("Frizelo Frigoríficos", 210 - 14, 18, { align: 'right' });
    doc.text("Bridge — Gestão TI", 210 - 14, 24, { align: 'right' });

    // ═══════════════════════════════════════════
    //  INFORMAÇÕES GERAIS
    // ═══════════════════════════════════════════
    let y = 52;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMAÇÕES GERAIS", 14, y);
    y += 2;
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Info row 1
    doc.setFont("helvetica", "bold");
    doc.text("Início Previsto:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(schedule.startTime || '06:00', 50, y);

    doc.setFont("helvetica", "bold");
    doc.text("Temp. Câmara:", 80, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${schedule.chamberTemperature || '-'}°C`, 115, y);

    doc.setFont("helvetica", "bold");
    doc.text("Responsável:", 140, y);
    doc.setFont("helvetica", "normal");
    doc.text(schedule.responsibleName || '-', 170, y);
    y += 8;

    // ═══════════════════════════════════════════
    //  TABELA DE LOTES
    // ═══════════════════════════════════════════
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("PROGRAMAÇÃO DE LOTES", 14, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 4;

    const tableData = schedule.lots.map((lot: any, idx: number) => [
        lot.lotNumber || (idx + 1),
        lot.origin || '-',
        lot.broker?.name || '-',
        lot.totalCarcassas || 0,
        `${(lot.pesoMedioCarcassa || 0).toFixed(1)}`,
        `${((lot.totalCarcassas || 0) * (lot.pesoMedioCarcassa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}`,
        lot.destino?.replace(/_/g, ' ') || '-',
        lot.startTime || '-'
    ]);

    const totalPecas = schedule.lots.reduce((s: number, l: any) => s + (l.totalCarcassas || 0), 0);
    const totalPeso = schedule.lots.reduce((s: number, l: any) => s + (l.totalCarcassas || 0) * (l.pesoMedioCarcassa || 0), 0);

    autoTable(doc, {
        startY: y,
        head: [['#', 'Origem / Item', 'Corretor', 'Qtd', 'Peso Méd.', 'Total (Kg)', 'Destino', 'Início']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.5,
            halign: 'center',
            cellPadding: 3
        },
        bodyStyles: {
            fontSize: 7.5,
            cellPadding: 2.5,
            textColor: [40, 40, 40]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
            1: { cellWidth: 45 },
            2: { cellWidth: 30 },
            3: { halign: 'center', cellWidth: 14 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
            6: { halign: 'center', cellWidth: 25 },
            7: { halign: 'center', cellWidth: 16 }
        },
        alternateRowStyles: {
            fillColor: [245, 247, 255]
        },
        foot: [[
            '',
            'TOTAIS',
            '',
            totalPecas.toString(),
            '',
            totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
            '',
            ''
        ]],
        footStyles: {
            fillColor: [230, 235, 255],
            textColor: [40, 40, 60],
            fontStyle: 'bold',
            fontSize: 8
        }
    });

    // ═══════════════════════════════════════════
    //  RESUMO POR CORRETOR
    // ═══════════════════════════════════════════
    const finalY = (doc as any).lastAutoTable.finalY || 180;
    let summaryY = finalY + 10;

    // Agrupar por corretor
    const brokerSummary: Record<string, { qtd: number; peso: number }> = {};
    schedule.lots.forEach((lot: any) => {
        const brokerName = lot.broker?.name || 'Sem Corretor';
        if (!brokerSummary[brokerName]) {
            brokerSummary[brokerName] = { qtd: 0, peso: 0 };
        }
        brokerSummary[brokerName].qtd += (lot.totalCarcassas || 0);
        brokerSummary[brokerName].peso += (lot.totalCarcassas || 0) * (lot.pesoMedioCarcassa || 0);
    });

    const brokerEntries = Object.entries(brokerSummary);
    if (brokerEntries.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.text("RESUMO POR CORRETOR", 14, summaryY);
        summaryY += 2;
        doc.setDrawColor(102, 126, 234);
        doc.line(14, summaryY, 196, summaryY);
        summaryY += 4;

        autoTable(doc, {
            startY: summaryY,
            head: [['Corretor', 'Qtd Carcaças', 'Peso Total (Kg)', '% do Total']],
            body: brokerEntries.map(([name, data]) => [
                name,
                data.qtd.toString(),
                data.peso.toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
                totalPeso > 0 ? `${((data.peso / totalPeso) * 100).toFixed(1)}%` : '0%'
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: [118, 75, 162],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 7.5
            },
            bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'center' }
            }
        });
    }

    // ═══════════════════════════════════════════
    //  OBSERVAÇÕES
    // ═══════════════════════════════════════════
    const obsY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : summaryY + 10;

    if (schedule.notes) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.text("OBSERVAÇÕES", 14, obsY);
        doc.setDrawColor(102, 126, 234);
        doc.line(14, obsY + 2, 196, obsY + 2);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(schedule.notes, 180);
        doc.text(lines, 14, obsY + 8);
    }

    // ═══════════════════════════════════════════
    //  CAMPOS DE ASSINATURA
    // ═══════════════════════════════════════════
    const signY = 260;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);

    // Assinatura 1
    doc.line(14, signY, 80, signY);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Encarregado da Desossa", 25, signY + 4);

    // Assinatura 2
    doc.line(100, signY, 196, signY);
    doc.text("Supervisor / SIF", 130, signY + 4);

    // ═══════════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════════
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Bridge Tecnologia / Frizelo Frigoríficos`, 14, 290);
    doc.text(`Pré-Escala de Desossa — ${dateFormatted}`, 210 - 14, 290, { align: 'right' });

    doc.save(`Pre_Escala_Desossa_${new Date(schedule.scheduleDate).toISOString().split('T')[0]}.pdf`);
}
