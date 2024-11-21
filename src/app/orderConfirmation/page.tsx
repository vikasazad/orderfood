"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clearCart } from "@/lib/features/addToOrderSlice";
import { RootState } from "@/lib/store";
import { CheckCircle, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

export default function OrderConfirmation() {
  const dispatch = useDispatch();
  const router = useRouter();
  const finalItem = useSelector(
    (state: RootState) => state.addToOrderData.finalOrder
  );
  console.log("DATA", finalItem);
  const orderDetails = {
    orderNumber: "123456",
    estimatedDeliveryTime: "30-45 minutes",
    deliveryAddress: "123 Main St, Anytown, USA",
    items: [
      { name: "Margherita Pizza", quantity: 1, price: 12.99 },
      { name: "Caesar Salad", quantity: 1, price: 8.99 },
      { name: "Garlic Bread", quantity: 1, price: 4.99 },
    ],
  };

  const total = finalItem.orderedItem.reduce(
    (sum: any, item: any) => sum + item.price * item.count,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Order Placed Successfully!
          </CardTitle>
          <CardDescription>
            Thank you for your order. Your food is being prepared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Order Number:</span>
            <span>{finalItem.orderId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Payment Id:</span>
            <span>{finalItem.razorpayPaymentId}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>
              Estimated delivery time: {orderDetails.estimatedDeliveryTime}
            </span>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5 mt-1" />
            <span>{orderDetails.deliveryAddress}</span>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            {finalItem.orderedItem.map((item: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center py-2"
              >
                <span>
                  {item.count}x {item.name}
                </span>
                <span>&#8377;{item.price * item.count}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 font-semibold border-t mt-2">
              <span>Total</span>
              <span>&#8377;{total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => {
              dispatch(clearCart());
              router.push("/");
            }}
          >
            View order
          </Button>
          <Button
            onClick={() => {
              dispatch(clearCart());
              router.push("/");
            }}
          >
            Return to Menu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
