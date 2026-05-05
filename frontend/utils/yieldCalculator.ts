// srcf/utils/yieldCalculator.ts

export const YIELDS = {
    TRASEIRO: 0.48,   // 48% da meia-carcaça
    DIANTEIRO: 0.39,  // 39%
    PONTA_AGULHA: 0.13 // 13%
};

export interface DecomposedLots {
    traseiro: { quantity: number; avgWeight: number; };
    dianteiro: { quantity: number; avgWeight: number; };
    pontaAgulha: { quantity: number; avgWeight: number; };
}

/**
 * Decompõe animal inteiro em 3 cortes proporcionais
 * @param heads - número de cabeças
 * @param carcassWeight - peso total da carcaça (2 bandas) em kg
 */
export function decomposeAnimal(heads: number, carcassWeight: number): DecomposedLots {
    const sideWeight = carcassWeight / 2; // peso de cada banda

    return {
        traseiro: {
            quantity: heads * 2, // 2 bandas por animal
            avgWeight: parseFloat((sideWeight * YIELDS.TRASEIRO).toFixed(2)),
        },
        dianteiro: {
            quantity: heads * 2,
            avgWeight: parseFloat((sideWeight * YIELDS.DIANTEIRO).toFixed(2)),
        },
        pontaAgulha: {
            quantity: heads * 2,
            avgWeight: parseFloat((sideWeight * YIELDS.PONTA_AGULHA).toFixed(2)),
        },
    };
}
