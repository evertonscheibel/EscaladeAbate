// srcf/utils/deboningPdfGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateDeboningPDF(schedule: any) {
    const doc = new jsPDF();

    // Header com gradiente Bridge (#667eea → #764ba2)
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BRIDGE — Gestão TI", 14, 20);
    doc.setFontSize(12);
    doc.text("Programação Diária de Desossa", 14, 30);

    // Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date(schedule.scheduleDate).toLocaleDateString('pt-BR')}`, 14, 50);
    doc.text(`Início: ${schedule.startTime || '-'}`, 14, 55);
    doc.text(`Temp. Câmara: ${schedule.chamberTemperature || '-'}°C`, 14, 60);

    // Tabela de lotes
    const tableData = schedule.lots.map((lot: any) => [
        lot.origin || 'Desconhecido',
        lot.totalCarcassas || 0,
        `${(lot.pesoMedioCarcassa || 0).toFixed(2)} kg`,
        `${((lot.totalCarcassas || 0) * (lot.pesoMedioCarcassa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`,
        lot.destino?.replace('_', ' ') || '-'
    ]);

    const totalPecas = schedule.lots.reduce((s: number, l: any) => s + (l.totalCarcassas || 0), 0);
    const totalPeso = schedule.lots.reduce((s: number, l: any) => s + (l.totalCarcassas || 0) * (l.pesoMedioCarcassa || 0), 0);

    autoTable(doc, {
        startY: 70,
        head: [['Origem', 'Qtd', 'Peso Méd.', 'Total (Kg)', 'Destino']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234] },
        foot: [['TOTAIS', totalPecas, '-', `${totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, '-']],
        footStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // Notas
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.text("Observações:", 14, finalY + 10);
    doc.setFont("helvetica", "italic");
    doc.text(schedule.notes || "Sem observações adicionais.", 14, finalY + 15);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Bridge Tecnologia / Frizelo Frigoríficos`, 14, 285);

    doc.save(`Programacao_Desossa_${new Date(schedule.scheduleDate).toISOString().split('T')[0]}.pdf`);
}
