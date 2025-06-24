'use client'

import { Button } from "@/components/ui/button";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import { Cart, CartItem } from "@/types";
import { Loader, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

const AddToCart = ({ item, cart }: { item: CartItem, cart?: Cart }) => {

    const router = useRouter();

    const [isPending, startTransition] = useTransition()

    const handleAddToCart = async () => {
        startTransition(async () => {

            const res = await addItemToCart(item);

            if (!res.success) {
                toast.error(res.message)
                return
            }

            // Handle success add to cart
            toast.success(res.message, {
                action: (
                    <Button className="bg-primary text-white hover:bg-gray-800"
                        onClick={() => router.push("/cart")}
                    >Go To Cart</Button>
                )
            })
        })

    }

    const handleRemoveFromCart = async () => {
        startTransition(async () => {

            const res = await removeItemFromCart(item.productId)

            if (!res.success) {
                toast.error(res.message)
                return
            }

            toast.success(res.message)
            return
        })
    }

    // check if item in cart
    const existItem = cart && cart.items.find(x => x.productId === item.productId)

    return existItem ? (<div>
        <Button type="button" variant="outline" onClick={handleRemoveFromCart}>
            {
                isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />
            }
        </Button>
        <span className="px-2">{existItem.qty}</span>
        <Button type="button" variant="outline" onClick={handleAddToCart}>
            {
                isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />
            }
        </Button>
    </div>) : (<Button className="w-full" type="button" onClick={handleAddToCart}>
        {
            isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />
        }{' '}Add To Cart
    </Button>);
}

export default AddToCart;