export interface Company {
    _id: string;
    nome_fantasia: string;
    razao_social?: string;
    cnpj?: string;
    tipo: 'fornecedor' | 'cliente' | 'prestador' | 'outros';
    telefone?: string;
    email?: string;
    endereco?: string;
    ativo: boolean;
}

export interface Vehicle {
    _id: string;
    placa: string;
    tipo_veiculo: 'caminhao' | 'carro' | 'moto' | 'utilitario' | 'carreta' | 'outros';
    marca_modelo?: string;
    cor?: string;
    frota_propria: boolean;
    empresa_id?: string | Company;
    recorrente: boolean;
    observacoes?: string;
    ativo: boolean;
}

export interface AccessPerson {
    _id: string;
    nome: string;
    documento?: string;
    telefone?: string;
    empresa_id?: string | Company;
    recorrente: boolean;
    observacoes?: string;
    ativo: boolean;
}

export interface Gatehouse {
    _id: string;
    nome: string;
    localizacao?: string;
    ativo: boolean;
}

export interface AccessType {
    _id: string;
    nome: string;
    descricao?: string;
    cor: string;
    icone: string;
    ordem: number;
    ativo: boolean;
}

export interface AccessReason {
    _id: string;
    tipo_acesso_id: string;
    nome: string;
    descricao?: string;
    ordem: number;
    ativo: boolean;
}

export interface GatehouseAccess {
    _id: string;
    ticket: string;
    guarita_id: string | Gatehouse;
    veiculo_id: string | Vehicle;
    pessoa_id?: string | AccessPerson;
    empresa_id?: string | Company;
    tipo_acesso_id: string | AccessType;
    motivo_acesso_id?: string | AccessReason;
    destino?: string;
    dt_entrada: string;
    dt_saida?: string;
    permanencia_min?: number;
    status: 'NO_PATIO' | 'FINALIZADO' | 'CANCELADO';
    observacao_entrada?: string;
    observacao_saida?: string;
    houve_ocorrencia: boolean;
    descricao_ocorrencia?: string;
    device_id?: string;
    anexos?: any[];
    createdAt: string;
    updatedAt: string;
}

export interface DashboardKPIs {
    entradas_hoje: number;
    saidas_hoje: number;
    no_patio_agora: number;
    permanencia_media_min: number;
}
