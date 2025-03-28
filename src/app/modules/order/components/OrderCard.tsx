"use client";

import { useEffect, useState, useTransition } from "react";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  addData,
  clearCart,
  clearSpecific,
  decrement,
  increment,
  setFinalOrder,
} from "@/lib/features/addToOrderSlice";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { sendNotification } from "@/lib/sendNotification";
import {
  calculateTax,
  calculateTotal,
  getOnlineStaffFromFirestore,
  removeTableByNumber,
  sendHotelOrder,
  sendOrder,
  updateOrdersForAttendant,
} from "../utils/orderApi";

export default function OrderCard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const table = useSelector((state: RootState) => state.addToOrderData.user);
  console.log("TABLE", table);
  const ordereditems = useSelector(
    (state: RootState) => state.addToOrderData.addToOrderData
  );
  const token = useSelector((state: RootState) => state.addToOrderData.token);

  const [selectedPortion, setSelectedPortion] = useState("");
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [finalPrice, setfinalPrice] = useState(0);
  const [loadScript, setLoadScript] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const total = ordereditems.reduce((total, item) => {
      const price = item.item.price[item.selectedType];
      return total + price * item.count;
    }, 0);
    const digit = Number(table?.tax.gstPercentage) || 0;
    console.log(digit);
    const tax = Math.round((total * digit) / 100);
    setfinalPrice(total + tax);
  }, [ordereditems, table]);

  const removeAfterZero = (item: any, id: any) => {
    if (ordereditems.length === 1) {
      if (ordereditems[0].count <= 1) {
        router.back();
        dispatch(clearCart());
      }
    }
    // console.log("dfhdfhdfgh", id.count);
    if (item.count <= 1) {
      dispatch(clearSpecific(id));
    }
  };
  const handlePortionSelect = (item: any) => {
    if (item.selectedType !== "Single") {
      setActiveItem(item);
    } else {
      dispatch(increment({ id: item.item.id }));
    }
  };

  const addItemWithPortion = (item: any) => {
    console.log("item", item);
    if (activeItem && selectedPortion) {
      dispatch(
        addData({
          data: item.item,
          selectedType: selectedPortion,
        })
      );
      setActiveItem(null);
      setSelectedPortion("");
    }
  };
  console.log(finalPrice);
  function generateOrderId(restaurantCode: string, tableNo: string) {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const orderId = `${restaurantCode}:T-${tableNo}:${randomNumber}`;
    return orderId;
  }
  const createOrderData = (data: any) => {
    // console.log("kjjkjjhjhjhjhjh", data);
    const object = {
      id: data.item.id,
      name: data.item.name,
      quantity: data.selectedType,
      price: data.item.price[data.selectedType],
      count: data.count,
    };
    return object;
  };
  const handlePlaceOrder = async () => {
    console.log("clicked");
    setLoadScript(true);
    createOrder();
    // router.push("/Detail");
  };

  const createOrder = async () => {
    const res = await fetch("/api/createOrder", {
      method: "POST",
      body: JSON.stringify({ amount: finalPrice * 100 }),
    });
    const data = await res.json();

    const paymentData = {
      key: process.env.RAZORPAY_API_KEY,
      order_id: data.id,
      name: "Rosier",
      description: "Thank you",
      image: "",
      prefill: {
        name: table?.phone,
        contact: table?.phone,
      },
      notes: {
        address: "Razorpay Corporate Office",
      },
      theme: {
        color: "#121212",
      },
      handler: async function (response: any) {
        const res = await fetch("/api/verifyOrder", {
          method: "POST",
          body: JSON.stringify({
            orderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        const data = await res.json();

        if (data.isOk) {
          startTransition(async () => {
            const orderId = generateOrderId("RES", table?.tableNo);
            const orderData: any = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              orderId: orderId,
              orderSuccess: true,
              orderedItem: [],
              orderAmount: finalPrice,
              subtotal: calculateTotal(ordereditems),
              gstPercentage: table?.tax.gstPercentage || "",
              gstAmount: table?.tax.gstPercentage
                ? calculateTax(ordereditems, table?.tax.gstPercentage)
                : "",
              contactNo: table?.phone,
              name: "",
              email: "",
              problemFood: "",
              problemService: "",
              timeOfOrder: new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              timeOfService: "",
              tableNo: table?.tableNo,
              estimatedDeliveryTime: "",
              deliveryAddress: "",
              specialrequirements: specialRequirements,
            };

            ordereditems.map((er: any) => {
              return orderData.orderedItem.push(createOrderData(er));
            });

            dispatch(setFinalOrder(orderData));
            const attendant: any = await getOnlineStaffFromFirestore(
              table?.email
            );

            if (table?.tag === "hotel") {
              await sendHotelOrder(orderData, attendant, table?.tableNo);
            } else {
              await sendOrder(orderData, token, attendant);
            }

            await updateOrdersForAttendant(attendant?.name, orderId);
            if (table?.tag === "restaurant") {
              await removeTableByNumber(table?.email, table?.tableNo);
            }

            await sendNotification(
              token,
              "New Order Received",
              "Hi [Waiter Name], a new order has been placed at Table [Table Number]. Please review the details and ensure prompt service. Thank you!"
            );

            router.push("/orderConfirmation");
          });
        } else {
          const orderId = generateOrderId("ROS", table?.tableNo);
          console.log("New Order ID:", orderId);
          console.log("first", ordereditems);
          const orderData: any = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            orderId: orderId,
            orderSuccess: false,
            orderedItem: [],
            orderAmount: finalPrice,
            subtotal: calculateTotal(ordereditems),
            gstPercentage: table?.tax.gstPercentage || "",
            gstAmount: "",
            contactNo: "",
            name: "",
            email: "",
            problemFood: "",
            problemService: "",
            timeOfOrder: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            timeOfService: "",
            tableNo: "T-8",
            estimatedDeliveryTime: "",
            deliveryAddress: "",
            specialrequirements: specialRequirements,
          };
          ordereditems.map((er: any) => {
            return orderData.orderedItem.push(createOrderData(er));
          });
          dispatch(setFinalOrder(orderData));
          console.log(orderData);
          router.push("/orderConfirmation");
          alert("Payment failed");
        }
      },
    };

    const payment = new (window as any).Razorpay(paymentData);
    payment.open();
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {isPending && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Processing your order...
            </p>
          </div>
        </div>
      )}
      {loadScript && (
        <Script
          type="text/javascript"
          src="https://checkout.razorpay.com/v1/checkout.js"
        />
      )}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardContent className="px-3 py-6 space-y-6">
          {ordereditems.map((item, id) => (
            <div key={id} className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 mt-1">
                  <div
                    className={cn(
                      "w-full h-full border rounded-sm",
                      item.item.nature === "Veg"
                        ? "border-green-500"
                        : "border-red-500"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 m-0.5 rounded-full",
                        item.item.nature === "Veg"
                          ? "bg-green-500"
                          : "bg-red-500"
                      )}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium">{item.item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ₹{item.item.price[item.selectedType]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center rounded-md bg-primary/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      dispatch(decrement({ id: id }));
                      removeAfterZero(item, id);
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.count}</span>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePortionSelect(item)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    {activeItem &&
                      typeof activeItem.item.price === "object" && (
                        <SheetContent side="bottom" className="h-[250px]">
                          <SheetHeader>
                            <SheetTitle>{activeItem.item.name}</SheetTitle>
                          </SheetHeader>
                          <SheetDescription></SheetDescription>
                          <div className="py-6">
                            <RadioGroup
                              value={selectedPortion}
                              onValueChange={setSelectedPortion}
                            >
                              {Object.entries(activeItem.item.price).map(
                                ([size, price]: any) => (
                                  <div
                                    key={size}
                                    className="flex items-center justify-between py-2"
                                  >
                                    <Label htmlFor={size}>{size}</Label>
                                    <div className="flex items-center space-x-4">
                                      <span className="text-green-500">
                                        + {price}
                                      </span>
                                      <RadioGroupItem value={size} id={size} />
                                    </div>
                                  </div>
                                )
                              )}
                            </RadioGroup>
                            <div className="flex gap-4 mt-6">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setActiveItem(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="w-full"
                                onClick={() => addItemWithPortion(activeItem)}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </SheetContent>
                      )}
                  </Sheet>
                </div>
                <p className="mt-1 font-medium">
                  ₹ {item.item.price[item.selectedType]}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Input
              placeholder="Special requirements"
              onChange={(e) => setSpecialRequirements(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex justify-between">
              <span>MRP Total</span>
              <span>₹{calculateTotal(ordereditems)}</span>
            </div>
            {table?.tax?.gstPercentage ? (
              <div className="flex justify-between">
                <span>Taxes</span>
                <span>
                  ₹{calculateTax(ordereditems, table?.tax?.gstPercentage)}
                </span>
              </div>
            ) : (
              ""
            )}

            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total Amount</span>
              {/* <span>₹{calculateTotal() - 100 + 78}</span> */}
              <span>
                {table.tax.gstPercentage
                  ? `₹${
                      calculateTotal(ordereditems) +
                      calculateTax(ordereditems, table?.tax?.gstPercentage)
                    }`
                  : `₹${calculateTotal(ordereditems)}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-between md:w-[430px] md:m-auto">
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">TOTAL</span>
            <span className="text-xl font-semibold ml-3">
              {table.tax.gstPercentage
                ? `₹${
                    calculateTotal(ordereditems) +
                    calculateTax(ordereditems, table?.tax?.gstPercentage)
                  }`
                : `₹${calculateTotal(ordereditems)}`}
            </span>
          </div>
        </div>
        <Button
          className="flex-1 ml-4  font-semibold py-3"
          onClick={() => handlePlaceOrder()}
        >
          PLACE ORDER
        </Button>
      </div>
    </div>
  );
}
