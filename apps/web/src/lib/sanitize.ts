/**
 * Simple input sanitization for server-side use.
 */
export function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
}
