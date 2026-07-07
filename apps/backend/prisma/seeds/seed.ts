import { prisma } from "../../src/prismaClient.js";
import { currencies } from "./currencies.js";
import { countries } from "./countries.js";
import { uoms } from "./uoms.js";
import { permissions } from "./permissions.js";

async function seedMasterData() {
  console.log("Seeding global master data...");

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: { name: c.name, symbol: c.symbol },
      create: c,
    });
  }
  console.log("Currencies seeded.");

  for (const c of countries) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: c,
    });
  }
  console.log("Countries seeded.");

  for (const u of uoms) {
    await prisma.unitOfMeasure.upsert({
      where: { code: u.code },
      update: { name: u.name, category: u.category },
      create: u,
    });
  }
  console.log("Units of Measure seeded.");

  console.log("Seeding permissions...");
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
  }
  console.log("Permissions seeded.");

  console.log("Global master data & permissions seeding complete.");
}

seedMasterData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
