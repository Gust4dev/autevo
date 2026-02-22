import { describe, it, expect } from 'vitest';
import { formatCNPJ, formatBRL } from '../formatters';

describe('Formatters Utility', () => {
    it('formats CNPJ correctly', () => {
        const raw = '12345678000199';
        const formatted = formatCNPJ(raw);
        expect(formatted).toBe('12.345.678/0001-99');
    });

    it('handles partial CNPJ inputs', () => {
        const raw = '123456';
        const formatted = formatCNPJ(raw);
        expect(formatted).toBe('12.345.6');
    });

    it('formats BRL currency correctly', () => {
        // Note: Node's Intl implementation uses non-breaking spaces (\xA0) between symbol and number
        const result = formatBRL(1234.56).replace(/\s/g, ' ');
        expect(result).toBe('R$ 1.234,56');
    });
});
