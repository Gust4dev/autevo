const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  const configs = [
    {
      key: "trial_days_founder",
      value: "60",
      label: "Dias Trial Fundador",
      type: "number",
    },
    {
      key: "trial_days_standard",
      value: "14",
      label: "Dias Trial Padrão",
      type: "number",
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      create: config,
      update: config,
    });
    console.log(`Upserted config: ${config.key}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });
