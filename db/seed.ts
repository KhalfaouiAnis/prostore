import { prisma } from "@/db/prisma";
import sampleData from "@/db/sample-data";

async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: sampleData.products,
  });
}

main();
