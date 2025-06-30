'use client'

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import { Order } from "@/types";
import Image from "next/image";
import Link from "next/link";

import StripePayment from "@/app/(root)/order/[id]/stripe-payment";
import { Button } from "@/components/ui/button";
import { approvePayPalOrder, createPayPalOrder, deliverOrder, updateOrderToPaidCOD } from "@/lib/actions/order.actions";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useTransition } from "react";
import { toast } from "sonner";

const OrderDetailsTable = (
    { order, stripeClientSecret, paypalClientId, isAdmin }
        : { order: Omit<Order, 'paymentResult'>, stripeClientSecret: string | null, paypalClientId: string, isAdmin: boolean }) => {
    const { id, shippingAddress, orderItems, itemsPrice, shippingPrice, taxPrice, totalPrice, paymentMethod, isDelivered, isPaid, paidAt, deliveredAt } = order;

    const PrintLoadingState = () => {
        const [{ isPending, isRejected }] = usePayPalScriptReducer();
        let status = '';

        if (isPending) {
            status = 'Loading PayPal...';
        } else if (isRejected) {
            status = "Error Loading Paypal"
        }

        return status
    }

    const handleCreatePayPalOrder = async () => {
        const res = await createPayPalOrder(id)

        if (!res.success) {
            toast.error(res.message)
        }

        return res.data
    }

    const handleApprovePayPalOrder = async (data: { orderID: string }) => {
        const res = await approvePayPalOrder(id, data)

        if (!res.success) {
            toast.error(res.message)
        } else {
            toast(res.message)
        }
    }

    const MarkAsPaidButton = () => {
        const [isPending, startTransition] = useTransition();

        return (
            <Button type="button" disabled={isPending} onClick={() => startTransition(async () => {
                const res = await updateOrderToPaidCOD(order.id)
                if (!res.success) {
                    toast.error(res.message)
                } else {
                    toast.success(res.message)
                }
            })}>
                {isPending ? 'Processing...' : 'Mark As Paid'}
            </Button>
        )
    }

    const MarkAsDeliveredButton = () => {
        const [isPending, startTransition] = useTransition();

        return (
            <Button type="button" disabled={isPending} onClick={() => startTransition(async () => {
                const res = await deliverOrder(order.id)
                if (!res.success) {
                    toast.error(res.message)
                } else {
                    toast.success(res.message)
                }
            })}>
                {isPending ? 'Processing...' : 'Mark As Delivered'}
            </Button>
        )
    }

    return (<>
        <h1 className="py-4 text-2xl">Order {formatId(id)}</h1>
        <div className="grid md:grid-cols-3 md:gap-5">
            <div className="col-span-2 space-4-y overflow-x-auto">
                <Card>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Payment Method</h2>
                        <p className="mb-2">{paymentMethod}</p>
                        {isPaid ? (<Badge variant='default' >
                            Paid at {formatDateTime(paidAt!).dateTime}
                        </Badge>) : (
                            <Badge variant='destructive' >
                                Not Paid
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                <Card className="my-2">
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Shipping Address</h2>
                        <p>{shippingAddress.fullName}</p>
                        <p className="mb-2">
                            {shippingAddress.streetAddress},{shippingAddress.city}
                            {shippingAddress.postalCode},{shippingAddress.country}
                        </p>
                        {isDelivered ? (<Badge variant='default' >
                            Delivered at {formatDateTime(deliveredAt!).dateTime}
                        </Badge>) : (
                            <Badge variant='destructive' >
                                Not Delivered
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                <Card className="my-2">
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Order Items</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    orderItems.map(item => (
                                        <TableRow key={item.slug}>
                                            <TableCell>
                                                <Link className="flex items-center" href={`/product/${item.slug}`}>
                                                    <Image src={item.image} alt={item.name} height={50} width={50} />
                                                    <span className="px-2">{item.name}</span>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2">{item.qty}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${item.price}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardContent className="p-4 gap-4 space-y-4">
                        <div className="flex justify-between">
                            <div>Items</div>
                            <div>{formatCurrency(itemsPrice)}</div>
                        </div>
                        <div className="flex justify-between">
                            <div>Tax</div>
                            <div>{formatCurrency(taxPrice)}</div>
                        </div>
                        <div className="flex justify-between">
                            <div>Shipping</div>
                            <div>{formatCurrency(shippingPrice)}</div>
                        </div>
                        <div className="flex justify-between">
                            <div>Total</div>
                            <div>{formatCurrency(totalPrice)}</div>
                        </div>

                        {/* PAYPAL Payment */}
                        {
                            !isPaid && paymentMethod === "PayPal" && (
                                <div>
                                    <PayPalScriptProvider
                                        options={{ clientId: paypalClientId }}
                                    >
                                        <PrintLoadingState />
                                        <PayPalButtons createOrder={handleCreatePayPalOrder} onApprove={handleApprovePayPalOrder} />
                                    </PayPalScriptProvider>
                                </div>
                            )
                        }

                        {/* Stripe payment */}

                        {
                            !isPaid && paymentMethod === "Stripe" && stripeClientSecret && (
                                <StripePayment
                                    priceInCents={Number(order.totalPrice) * 100}
                                    orderId={order.id}
                                    clientSecret={stripeClientSecret}
                                />
                            )
                        }

                        {/* CASH On Delivery */}
                        <div className="flex flex-col gap-2">
                            {
                                isAdmin && !isPaid && paymentMethod === "CashOnDelivery" && (
                                    <MarkAsPaidButton />
                                )
                            }

                            {
                                isAdmin && isPaid && !isDelivered && (
                                    <MarkAsDeliveredButton />
                                )
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </>);
}

export default OrderDetailsTable;