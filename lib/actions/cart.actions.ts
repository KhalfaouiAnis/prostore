"use server";

import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { convertToPlainObject, formatError, round2 } from "@/lib/utils";
import { cartItemSchema, insertCartSchema } from "@/lib/validators";
import { CartItem } from "@/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
      items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(0.15 * itemsPrice),
    totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addItemToCart(data: CartItem) {
  try {
    // check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    // get session and user id
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get cart
    const cart = await getMyCart();

    // Parse and validate item
    const item = cartItemSchema.parse(data);

    // find product in db
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });

    if (!product) throw new Error("Product not found");

    if (!cart) {
      // create cart
      const newCart = insertCartSchema.parse({
        userId,
        items: [item],
        sessionCartId,
        ...calcPrice([item]),
      });

      // add to db
      await prisma.cart.create({
        data: newCart,
      });

      // revalidate product page
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      // check if item is already in the cart
      const existItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId
      );

      if (existItem) {
        // check stock
        if (product.stock < existItem.qty + 1)
          throw new Error("Not enough stock");
        // increase qty
        (cart.items as CartItem[]).find(
          (x) => x.productId === item.productId
        )!.qty = existItem.qty + 1;
      } else {
        // item does not exist in cart
        // check stock
        if (product.stock < 1) throw new Error("Not enough stock");
        // add item to cart.items
        cart.items.push(item);
      }

      // save to db
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calcPrice(cart.items as CartItem[]),
        },
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${
          existItem ? "updated in" : "added to"
        } cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  // check for cart cookie
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;

  if (!sessionCartId) {
    throw new Error("Cart session not found");
  }

  // get session and user id
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // get user cart from db
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionCartId },
  });

  if (!cart) return undefined;

  // convert deciamls
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}

export async function removeItemFromCart(productId: string) {
  try {
    // check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    // find product in db
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });

    if (!product) throw new Error("Product not found");

    // get user cart
    const cart = await getMyCart();
    if (!cart) throw new Error("Cart not found");

    // check for item
    const exist = (cart.items as CartItem[]).find(
      (x) => x.productId === productId
    );

    if (!exist) throw new Error("Item not found");

    // check if qty = 1
    if (exist.qty === 1) {
      cart.items = cart.items.filter((x) => x.productId !== exist.productId);
    } else {
      cart.items.find((x) => x.productId === productId)!.qty = exist.qty - 1;
    }

    // update cart in db
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items,
        ...calcPrice(cart.items),
      },
    });

    revalidatePath(`/product/${product.slug}`);
    return {
      success: true,
      message: `${product.name} was removed from cart`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
