import { prisma } from "@/db/prisma";
import sampleData from "@/db/sample-data";
import { hash } from "@/lib/encrypt";

async function main() {
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.product.createMany({
    data: sampleData.products,
  });

  const users = [];

  for (let i = 0; i < sampleData.users.length; i++) {
    const current = sampleData.users[i];
    users.push({
      ...current,
      password: await hash(current.password),
    });
  }

  await prisma.user.createMany({
    data: users,
  });

  console.log("Database seeded successfully.");

  process.exit(0);
}

main();
