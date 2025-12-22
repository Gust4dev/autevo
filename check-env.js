const fs = require('fs');
const path = require('path');

const webEnvPath = path.join(__dirname, 'apps/web/.env.local');
const dbEnvPath = path.join(__dirname, 'packages/database/.env');

function getDbUrl(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/DATABASE_URL=(.*)/);
  return match ? match[1].trim() : null;
}

const webUrl = getDbUrl(webEnvPath);
const dbUrl = getDbUrl(dbEnvPath);

console.log('Web URL found:', !!webUrl);
console.log('DB URL found:', !!dbUrl);

if (webUrl && dbUrl) {
  if (webUrl === dbUrl) {
    console.log('MATCH: As URLs sao iguais.');
  } else {
    console.log('MISMATCH: As URLs sao DIFERENTES!');
    console.log('Web termina com:', webUrl.slice(-10));
    console.log('DB termina com:', dbUrl.slice(-10));
  }
} else {
  console.log('Erro: Nao foi possivel encontrar as URLs em ambos os arquivos.');
}
