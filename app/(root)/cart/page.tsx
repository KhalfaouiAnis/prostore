import CartTable from "@/app/(root)/cart/cart-table";
import { getMyCart } from "@/lib/actions/cart.actions";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Shipping Cart'
}


const CartPage = async () => {

    const cart = await getMyCart();

    return (<CartTable cart={cart} />);
}

export default CartPage;