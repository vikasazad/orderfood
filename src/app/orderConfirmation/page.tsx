"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Copy, MapPin, Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { clearCart } from "@/lib/features/addToOrderSlice";
import React from "react";

export default function OrderConfirmation() {
  const dispatch = useDispatch();
  const router = useRouter();
  const finalItem = useSelector(
    (state: RootState) => state.addToOrderData.finalOrder
  );
  console.log("DATA", finalItem);
  const table = useSelector((state: RootState) => state.addToOrderData.user);
  console.log("HERETHEDATA", table);

  // Add useEffect to handle auto-close
  React.useEffect(() => {
    if (finalItem && table?.tag === "hotel") {
      const timer = setTimeout(() => {
        window.close();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [finalItem, table]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex justify-center"
        >
          <CheckCircle2
            className="w-16 h-16 text-green-500"
            strokeWidth={1.5}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-green-600">
            Order Placed Successfully!
          </h2>
          <p className="text-muted-foreground mt-1">
            Thank you for your order. Your food is being prepared.
          </p>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <div className="flex items-center gap-2">
              <p className="font-mono font-medium">{finalItem.orderId}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  copyToClipboard(finalItem.orderId, "Order number")
                }
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy order number</span>
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Payment ID</p>
            <div className="flex items-center gap-2">
              <p className="font-mono font-medium truncate">
                {finalItem.razorpayPaymentId}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() =>
                  copyToClipboard(finalItem.razorpayPaymentId, "Payment ID")
                }
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy payment ID</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Estimated Delivery Time</p>
              <p className="text-sm text-muted-foreground">25-30 minutes</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Table</p>
              <p className="text-sm text-muted-foreground">
                {finalItem.tableNo}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5" />
            <h3 className="font-semibold">Order Summary</h3>
          </div>

          <div className="space-y-3">
            {finalItem.orderedItem &&
              finalItem.orderedItem.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {item.count}x {item.name}
                    </p>
                  </div>
                  <p className="font-medium">₹{item.price * item.count}</p>
                </div>
              ))}

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Subtotal</span>
              <span className="text-lg font-semibold">
                ₹{finalItem.subtotal}
              </span>
            </div>
            {finalItem.gstAmount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tax</span>
                <span className="text-sm font-medium">
                  ₹{finalItem.gstAmount}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Grand Total</span>
              <span className="text-lg font-semibold">
                ₹{finalItem.orderAmount}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            dispatch(clearCart());
            router.push("/");
          }}
        >
          View Order
        </Button>
        <Button
          className="w-full"
          onClick={() => {
            dispatch(clearCart());
            router.push("/");
          }}
        >
          Return to Menu
        </Button>
      </CardFooter>
    </Card>
  );
}
