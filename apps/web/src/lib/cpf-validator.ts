/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * Uses the official algorithm to verify the check digits.
 * 
 * @param cpf - The CPF string (can contain formatting like dots and dashes)
 * @returns true if CPF is valid, false otherwise
 */
export function isValidCPF(cpf: string): boolean {
    // Remove non-digits
    const cleanCPF = cpf.replace(/\D/g, '');

    // Must have 11 digits
    if (cleanCPF.length !== 11) {
        return false;
    }

    // Reject known invalid patterns (all same digits)
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
        return false;
    }

    // Calculate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
        remainder = 0;
    }
    if (remainder !== parseInt(cleanCPF.charAt(9))) {
        return false;
    }

    // Calculate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
        remainder = 0;
    }
    if (remainder !== parseInt(cleanCPF.charAt(10))) {
        return false;
    }

    return true;
}

/**
 * Formats a CPF string to the standard format: ###.###.###-##
 * 
 * @param cpf - The raw CPF string
 * @returns Formatted CPF string
 */
export function formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
        return cpf;
    }
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Removes all formatting from a CPF string, returning only digits.
 * 
 * @param cpf - The CPF string (may contain formatting)
 * @returns CPF with only digits
 */
export function cleanCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
}
