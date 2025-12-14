/**
 * Detects the car part based on 3D coordinates
 * This is an approximation based on typical car dimensions
 * 
 * Coordinate system:
 * - X: left (-) to right (+)
 * - Y: bottom to top
 * - Z: back (-) to front (+)
 */

export type CarPart =
    | 'capo'           // Hood/Bonnet
    | 'teto'           // Roof
    | 'para_brisa'     // Windshield
    | 'vidro_traseiro' // Rear window
    | 'porta_dianteira_esq'   // Front left door
    | 'porta_dianteira_dir'   // Front right door
    | 'porta_traseira_esq'    // Rear left door
    | 'porta_traseira_dir'    // Rear right door
    | 'paralama_dianteiro_esq' // Front left fender
    | 'paralama_dianteiro_dir' // Front right fender
    | 'paralama_traseiro_esq'  // Rear left fender/quarter panel
    | 'paralama_traseiro_dir'  // Rear right fender/quarter panel
    | 'para_choque_dianteiro'  // Front bumper
    | 'para_choque_traseiro'   // Rear bumper
    | 'roda_dianteira_esq'     // Front left wheel
    | 'roda_dianteira_dir'     // Front right wheel
    | 'roda_traseira_esq'      // Rear left wheel
    | 'roda_traseira_dir'      // Rear right wheel
    | 'lateral_esquerda'       // Left side (generic)
    | 'lateral_direita'        // Right side (generic)
    | 'traseira'               // Rear/Trunk
    | 'dianteira'              // Front
    | 'indefinido';            // Unknown

const PART_LABELS: Record<CarPart, string> = {
    capo: 'Capô',
    teto: 'Teto',
    para_brisa: 'Para-brisa',
    vidro_traseiro: 'Vidro Traseiro',
    porta_dianteira_esq: 'Porta Diant. Esq.',
    porta_dianteira_dir: 'Porta Diant. Dir.',
    porta_traseira_esq: 'Porta Tras. Esq.',
    porta_traseira_dir: 'Porta Tras. Dir.',
    paralama_dianteiro_esq: 'Paralama Diant. Esq.',
    paralama_dianteiro_dir: 'Paralama Diant. Dir.',
    paralama_traseiro_esq: 'Paralama Tras. Esq.',
    paralama_traseiro_dir: 'Paralama Tras. Dir.',
    para_choque_dianteiro: 'Para-choque Diant.',
    para_choque_traseiro: 'Para-choque Tras.',
    roda_dianteira_esq: 'Roda Diant. Esq.',
    roda_dianteira_dir: 'Roda Diant. Dir.',
    roda_traseira_esq: 'Roda Tras. Esq.',
    roda_traseira_dir: 'Roda Tras. Dir.',
    lateral_esquerda: 'Lateral Esquerda',
    lateral_direita: 'Lateral Direita',
    traseira: 'Traseira',
    dianteira: 'Dianteira',
    indefinido: 'Indefinido',
};

export function getPartLabel(part: CarPart): string {
    return PART_LABELS[part] || 'Indefinido';
}

/**
 * Detect which part of the car was clicked based on coordinates
 * 
 * Assumes a smaller 3D model (~0.8m long) with center at origin:
 * - Front: Z > 0.25
 * - Rear: Z < -0.25
 * - Left: X < -0.15
 * - Right: X > 0.15
 * - Top: Y > 0.25
 * - Wheel level: Y < 0.15
 */
export function detectCarPart(
    position: [number, number, number],
    normal: [number, number, number]
): CarPart {
    const [x, y, z] = position;
    const [nx, ny, nz] = normal;

    // Debug: log coordinates
    console.log('[detectCarPart] coords:', { x: x.toFixed(2), y: y.toFixed(2), z: z.toFixed(2), nx: nx.toFixed(2), ny: ny.toFixed(2), nz: nz.toFixed(2) });

    // Check if it's a wheel (low Y position, specific X and Z locations)
    if (y < 0.15) {
        const isLeftSide = x < -0.1;
        const isRightSide = x > 0.1;
        const isFrontWheel = z > 0.15;
        const isRearWheel = z < -0.15;

        if (isFrontWheel && isLeftSide) return 'roda_dianteira_esq';
        if (isFrontWheel && isRightSide) return 'roda_dianteira_dir';
        if (isRearWheel && isLeftSide) return 'roda_traseira_esq';
        if (isRearWheel && isRightSide) return 'roda_traseira_dir';
    }

    // Check if it's the roof (normal pointing up and high Y)
    if (ny > 0.7 && y > 0.25) {
        return 'teto';
    }

    // Check if it's the hood (front, top-facing)
    if (z > 0.2 && ny > 0.3 && y > 0.15) {
        return 'capo';
    }

    // Check if it's the windshield (front, angled up)
    if (z > 0.1 && z < 0.35 && ny > 0.3 && nz > 0.3) {
        return 'para_brisa';
    }

    // Check if it's the rear window
    if (z < -0.1 && z > -0.35 && ny > 0.3 && nz < -0.3) {
        return 'vidro_traseiro';
    }

    // Check if it's a bumper
    if (z > 0.35) {
        return 'para_choque_dianteiro';
    }
    if (z < -0.35) {
        return 'para_choque_traseiro';
    }

    // Check trunk/rear (normal pointing back)
    if (z < -0.25 && nz < -0.5) {
        return 'traseira';
    }

    // Check front/grille (normal pointing front)
    if (z > 0.25 && nz > 0.5) {
        return 'dianteira';
    }

    // Side panels - check normal direction
    const isLeftSide = nx < -0.5;
    const isRightSide = nx > 0.5;

    if (isLeftSide || isRightSide) {
        // Front fender (near front wheel)
        if (z > 0.1) {
            return isLeftSide ? 'paralama_dianteiro_esq' : 'paralama_dianteiro_dir';
        }

        // Rear fender (near rear wheel)
        if (z < -0.1) {
            return isLeftSide ? 'paralama_traseiro_esq' : 'paralama_traseiro_dir';
        }

        // Doors (middle section)
        if (z > 0) {
            return isLeftSide ? 'porta_dianteira_esq' : 'porta_dianteira_dir';
        } else {
            return isLeftSide ? 'porta_traseira_esq' : 'porta_traseira_dir';
        }
    }

    // Generic side detection by position
    if (x < -0.1) {
        return 'lateral_esquerda';
    }
    if (x > 0.1) {
        return 'lateral_direita';
    }

    return 'indefinido';
}
