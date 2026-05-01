import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  if (!email) {
    throw new Error("SUPER_ADMIN_EMAIL is not set in the environment");
  }

  const user = await db.user.upsert({
    where: { email },
    create: { email, role: "super_admin" },
    update: { role: "super_admin" },
  });

  console.log(`[seed-admin] super_admin user ${user.email} (id=${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
