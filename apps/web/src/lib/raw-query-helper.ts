/**
 * Helper para garantir que queries raw sempre incluam tenantId.
 * Não é um mecanismo de segurança infalível (pois não faz parse da AST SQL),
 * mas sim uma convenção robusta para facilitar code review e evitar omissões acidentais
 * de desenvolvedores no longo prazo.
 */
export function assertTenantInRawQuery(sql: string, tenantId: string): void {
    // Normalize checking for either quoted or unquoted tenantId column
    if (!sql.includes('"tenantId"') && !sql.includes("tenantId")) {
        throw new Error(
            `[SECURITY] Raw query sem filtro de tenantId detectada. ` +
            `Todas as raw queries DEVEM incluir WHERE "tenantId" = $tenantId para evitar vazamento cross-tenant. ` +
            `Query: ${sql.substring(0, 100)}...`,
        );
    }
}
