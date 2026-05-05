export interface PacProgram {
    _id: string;
    codigo: string;
    nome: string;
    descricao?: string;
    responsavel_tecnico: any;
    ativo: boolean;
}

export interface ProductionArea {
    _id: string;
    codigo: string;
    nome: string;
    setor: 'Abate' | 'Processamento' | 'Estoque' | 'Expedição' | 'Utilidades';
    qr_code: string;
    responsavel: any;
    ativo: boolean;
}

export interface ChecklistItem {
    _id: string;
    ordem: number;
    descricao: string;
    tipo_resposta: 'OK_NOK_NA' | 'Numérico' | 'Texto' | 'Foto';
    unidade_medida?: string;
    limite_minimo?: number;
    limite_maximo?: number;
    obrigatorio: boolean;
    gera_nc_automatica: boolean;
    criticidade: 'Crítico' | 'Maior' | 'Menor';
    instrucao_item?: string;
}

export interface ChecklistModel {
    _id: string;
    codigo: string;
    titulo: string;
    programa: PacProgram;
    area: ProductionArea;
    frequencia: 'Pre-operacional' | 'Operacional' | 'Diário' | 'Semanal' | 'Mensal';
    turno: string[];
    versao: string;
    status: 'Ativo' | 'Inativo' | 'Em revisão';
    itens: ChecklistItem[];
}

export interface ChecklistExecution {
    _id: string;
    codigo_execucao: string;
    modelo: ChecklistModel;
    area: ProductionArea;
    turno: 'A' | 'B' | 'C';
    status: 'Em andamento' | 'Finalizado' | 'Finalizado com NC' | 'Cancelado';
    data_hora_abertura: string;
    data_hora_fechamento?: string;
    executor: any;
    tem_nc: boolean;
    total_itens: number;
    total_ok: number;
    total_nok: number;
    total_na: number;
    respostas: any[];
    hash_integridade?: string;
}

export interface NonConformity {
    _id: string;
    codigo_nc: string;
    origem_execucao: ChecklistExecution;
    origem_item: string;
    descricao: string;
    criticidade: 'Crítico' | 'Maior' | 'Menor';
    area: ProductionArea;
    programa: PacProgram;
    responsavel_acao: any;
    prazo: string;
    status: 'Aberta' | 'Em andamento' | 'Aguardando verificação' | 'Fechada' | 'Vencida';
    data_abertura: string;
}
