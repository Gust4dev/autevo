import * as fs from "fs";
import * as path from "path";

const schema = fs.readFileSync(
    path.resolve(__dirname, "../prisma/schema.prisma"),
    "utf8"
);

const tenantFile = fs.readFileSync(
    path.resolve(__dirname, "../../../apps/web/src/lib/prisma-tenant.ts"),
    "utf8"
);

const modelRegex = /model\s+(\w+)\s*\{[^}]*?tenantId\s+String/gs;
const modelsFromSchema: string[] = [];
let match;
while ((match = modelRegex.exec(schema)) !== null) {
    modelsFromSchema.push(match[1]);
}

const listMatch = tenantFile.match(/isolatedModels\s*=\s*\[([\s\S]*?)\]/);
const modelsFromList = listMatch
    ? (listMatch[1].match(/'(\w+)'/g) || []).map((s) => s.replace(/'/g, ""))
    : [];

const missing = modelsFromSchema.filter((m) => !modelsFromList.includes(m));

if (missing.length > 0) {
    console.error("❌ Models com tenantId NAO na lista de isolamento:");
    missing.forEach((m) => console.error(`   - ${m}`));
    process.exit(1);
}

console.log(
    `✅ ${modelsFromSchema.length} models com tenantId estão isolados.`,
);
