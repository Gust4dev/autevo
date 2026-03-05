/**
 * 🛡️ P1-1: Robust input sanitization for server-side use.
 * Zero external dependencies — uses comprehensive regex patterns
 * to neutralize XSS vectors including event handlers, javascript: protocol,
 * HTML entities, template injection, and encoded payloads.
 *
 * This is defense-in-depth: React already escapes output by default.
 * This layer protects against stored XSS in contexts like email, PDF, or webhook payloads.
 */
export function sanitizeInput(input: string): string {
    return input
        // 1. Decode HTML entities first so encoded attacks don't bypass later filters
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#x27;/gi, "'")
        .replace(/&#x2F;/gi, '/')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        // 2. Strip all HTML tags (including self-closing and malformed)
        .replace(/<[^>]*>/g, '')
        // 3. Remove javascript: and data: protocol patterns
        .replace(/javascript\s*:/gi, '')
        .replace(/data\s*:\s*text\/html/gi, '')
        .replace(/vbscript\s*:/gi, '')
        // 4. Remove inline event handlers (onerror=, onload=, onclick=, etc.)
        .replace(/\bon\w+\s*=/gi, '')
        // 5. Remove template injection patterns
        .replace(/\$\{[^}]*\}/g, '')
        .replace(/\{\{[^}]*\}\}/g, '')
        // 6. Strip null bytes (bypass technique)
        .replace(/\0/g, '')
        .trim();
}
