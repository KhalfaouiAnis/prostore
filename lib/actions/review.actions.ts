"use server";

import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { formatError } from "@/lib/utils";
import { insertReviewSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createUpdateReview(
  data: z.infer<typeof insertReviewSchema>
) {
  try {
    const session = await auth();
    if (!session) throw new Error("User not authenticated");

    const review = insertReviewSchema.parse({
      ...data,
      userId: session.user.id,
    });

    const product = await prisma.product.findFirst({
      where: { id: review.productId },
    });

    if (!product) throw new Error("Product not found");

    // check if user already reviewed
    const reviewExists = await prisma.review.findFirst({
      where: { productId: review.productId, userId: review.userId },
    });

    await prisma.$transaction(async (tx) => {
      if (reviewExists) {
        await tx.review.update({
          where: { id: reviewExists.id },
          data: {
            title: review.title,
            description: review.description,
            rating: review.rating,
          },
        });
      } else {
        await tx.review.create({
          data: review,
        });
      }

      //   Get avg rating
      const averageRating = await tx.review.aggregate({
        _avg: { rating: true },
        where: { productId: review.productId },
      });

      //   Get number of reviews
      const numReviews = await tx.review.count({
        where: { productId: review.productId },
      });

      //   Update rating an  numReview in product table
      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: averageRating._avg.rating || 0,
          numReviews,
        },
      });
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `Review ${reviewExists ? "Updated" : "Created"} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getReviews({ productId }: { productId: string }) {
  const data = await prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    data,
  };
}

export async function getReviewByProductId({
  productId,
}: {
  productId: string;
}) {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  return await prisma.review.findFirst({
    where: { productId, userId: session.user.id },
  });
}
