import OrderDetailsTable from "@/app/(root)/order/[id]/order-details-table";
import { getOrderById } from "@/lib/actions/order.actions";
import { ShippingAddress } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
    title: 'Order details'
}

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
    const { id } = await props.params;
    const order = await getOrderById(id)

    if (!order) notFound();

    return (<OrderDetailsTable order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress
    }} />);
}

export default OrderDetailsPage;