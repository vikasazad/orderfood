"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Minus,
  Plus,
  ChevronLeft,
  HandPlatter,
  Pencil,
  Trash2,
  Dot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
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
  addKitchenOrder,
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
  const { user } = useSelector((state: RootState) => state.auth);

  const ordereditems = useSelector(
    (state: RootState) => state.addToOrderData.addToOrderData
  );
  console.log("ordereditems", ordereditems);
  const token = useSelector((state: RootState) => state.addToOrderData.token);

  const [selectedPortion, setSelectedPortion] = useState("");
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [tempSpecialRequirements, setTempSpecialRequirements] = useState("");
  const [isSpecialRequestsOpen, setIsSpecialRequestsOpen] = useState(false);
  const [finalPrice, setfinalPrice] = useState(0);
  const [loadScript, setLoadScript] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const total = ordereditems.reduce((total, item) => {
      const price = item.item.price[item.selectedType];
      return total + price * item.count;
    }, 0);
    const digit = Number(user?.tax.gstPercentage) || 0;
    console.log(digit);
    const tax = Math.round((total * digit) / 100);
    setfinalPrice(total + tax);
  }, [ordereditems, user]);

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

  const handleSpecialRequestsOpen = () => {
    console.log("specialRequirements");
    setTempSpecialRequirements(specialRequirements);
    setIsSpecialRequestsOpen(true);
  };

  const handleSpecialRequestsAdd = () => {
    setSpecialRequirements(tempSpecialRequirements);
    setIsSpecialRequestsOpen(false);
  };

  const handleSpecialRequestsClear = () => {
    setTempSpecialRequirements("");
    setSpecialRequirements("");
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

    // console.log("asdfasd", process.env.RAZORPAY_API_KEY);
    // console.log("asdfasd", process.env.NEXT_PUBLIC_RAZORPAY_API_KEY);

    const paymentData = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY,
      order_id: data.id,
      name: "Rosier",
      description: "Thank you",
      image: "",
      prefill: {
        name: user?.phone,
        contact: user?.phone,
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
            const orderId = generateOrderId("RES", user?.tableNo);
            const orderData: any = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              orderId: orderId,
              orderSuccess: true,
              orderedItem: [],
              orderAmount: finalPrice,
              subtotal: calculateTotal(ordereditems),
              gstPercentage: user?.tax.gstPercentage || "",
              gstAmount: user?.tax.gstPercentage
                ? calculateTax(ordereditems, user?.tax.gstPercentage)
                : "",
              contactNo: user?.phone,
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
              tableNo: user?.tableNo,
              estimatedDeliveryTime: "",
              deliveryAddress: "",
              specialrequirements: specialRequirements,
            };

            ordereditems.map((er: any) => {
              return orderData.orderedItem.push(createOrderData(er));
            });

            dispatch(setFinalOrder(orderData));
            const attendant: any = await getOnlineStaffFromFirestore(
              user?.email
            );

            if (user?.tag === "concierge") {
              await sendHotelOrder(orderData, attendant, user?.tableNo);

              await addKitchenOrder(
                user?.email,
                generateOrderId("RES", user?.tableNo),
                user?.name,
                ordereditems.map((er: any) => {
                  return createOrderData(er);
                }),
                finalPrice
              );
            } else {
              await sendOrder(orderData, token, attendant);
              await addKitchenOrder(
                user?.email,
                generateOrderId("RES", user?.tableNo),
                user?.name,
                ordereditems.map((er: any) => {
                  return createOrderData(er);
                }),
                finalPrice
              );
            }

            await updateOrdersForAttendant(attendant?.name, orderId);
            if (user?.tag === "restaurant") {
              await removeTableByNumber(user?.email, user?.tableNo);
            }

            await sendNotification(
              token,
              "New Order Received",
              "Hi [Waiter Name], a new order has been placed at Table [Table Number]. Please review the details and ensure prompt service. Thank you!"
            );

            router.push("/orderConfirmation");
          });
        } else {
          const orderId = generateOrderId("ROS", user?.tableNo);
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
            gstPercentage: user?.tax.gstPercentage || "",
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
    <>
      <div className="bg-white border-b border-muted rounded-bl-3xl p-2 box-shadow-lg">
        <div
          className="ml-2 w-7 h-8 border-2 border-muted rounded-lg box-shadow-lg flex items-center justify-center"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-6 w-6 " strokeWidth={3} />
        </div>

        {/* <Button
          variant="ghost"
          className="h-15 w-15 mb-4 bg-white"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-10 w-10" />
        </Button> */}
      </div>
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

        <Card className="relative">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Order</h1>

              <HandPlatter className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="px-3 py-3 space-y-6">
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {item.selectedType}
                      </p>
                      <Dot className="h-2 w-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        ₹{item.item.price[item.selectedType]}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right ">
                  <div className="inline-flex items-center rounded-md bg-white border border-grey">
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
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePortionSelect(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DrawerTrigger>
                      {activeItem &&
                        typeof activeItem.item.price === "object" && (
                          <DrawerContent className="h-[250px]">
                            <DrawerHeader>
                              <DrawerTitle>{activeItem.item.name}</DrawerTitle>
                            </DrawerHeader>
                            <DrawerDescription></DrawerDescription>
                            <div className="py-6 px-4">
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
                                        <RadioGroupItem
                                          value={size}
                                          id={size}
                                        />
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
                          </DrawerContent>
                        )}
                    </Drawer>
                  </div>
                  <p className="mt-1 font-medium">
                    ₹ {item.item.price[item.selectedType]}
                  </p>
                </div>
              </div>
            ))}

            <hr
              className="w-full mt-4 border-t-2 border-dashed border-transparent"
              style={{
                borderImageSource:
                  "repeating-linear-gradient(to right, #f0f0f0 0, #f0f0f0 8px, transparent 10px, transparent 15px)",
                borderImageSlice: 1,
              }}
            />

            <div>
              <div
                className="flex items-center justify-between w-full p-3 border border-input bg-[#f0f0f0] rounded-xl cursor-pointer "
                onClick={() => {
                  handleSpecialRequestsOpen();
                }}
              >
                <span
                  className={
                    specialRequirements
                      ? "text-foreground text-xs"
                      : "text-muted-foreground text-xs"
                  }
                >
                  {specialRequirements || "Add special requests"}
                </span>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>

              <Drawer
                open={isSpecialRequestsOpen}
                onOpenChange={setIsSpecialRequestsOpen}
              >
                <DrawerContent className="h-auto max-h-[80vh] p-0 bg-slate-50">
                  <div className="flex flex-col h-full">
                    <DrawerHeader className="px-3 py-0 ">
                      <div className="flex items-center justify-between">
                        <DrawerTitle className="text-md font-semibold">
                          Add special instructions
                        </DrawerTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSpecialRequestsClear}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </DrawerHeader>

                    <div className="flex-1 px-3 py-2">
                      <div className="space-y-4">
                        <div className="relative">
                          <Textarea
                            placeholder="Start typing instructions"
                            value={tempSpecialRequirements}
                            onChange={(e) =>
                              setTempSpecialRequirements(e.target.value)
                            }
                            className="min-h-[80px] resize-none rounded-xl text-xs"
                            maxLength={200}
                          />
                          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                            {tempSpecialRequirements.length}/200
                          </div>
                        </div>

                        <p className="text-xs text-red-500">
                          Order instructions are provided for convenience, but
                          merchant adherence cannot be guaranteed. No
                          refunds/cancellations is possible.
                        </p>
                      </div>
                    </div>

                    <DrawerFooter className="px-3 py-4  bg-background rounded-2xl">
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSpecialRequestsAdd}
                          className="flex-1 bg-green-200 hover:bg-green-300 text-green-800"
                        >
                          ADD
                        </Button>
                      </div>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
            {/* <div className="space-y-2 pt-4">
              <div className="flex justify-between">
                <span>MRP Total</span>
                <span>₹{calculateTotal(ordereditems)}</span>
              </div>
              {user?.tax?.gstPercentage ? (
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>
                    ₹{calculateTax(ordereditems, user?.tax?.gstPercentage)}
                  </span>
                </div>
              ) : (
                ""
              )}

              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Amount</span>
                <span>₹{calculateTotal() - 100 + 78}</span>
                <span>
                  {user?.tax?.gstPercentage
                    ? `₹${
                        calculateTotal(ordereditems) +
                        calculateTax(ordereditems, user?.tax?.gstPercentage)
                      }`
                    : `₹${calculateTotal(ordereditems)}`}
                </span>
              </div>
            </div> */}
          </CardContent>
        </Card>

        <div className="fixed bottom-0 rounded-t-xl left-0 right-0 bg-white border-t px-4 py-2 flex items-center justify-between md:w-[430px] md:m-auto">
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">TOTAL</span>
              <span className="text-xl font-semibold ml-3">
                {user?.tax?.gstPercentage
                  ? `₹${
                      calculateTotal(ordereditems) +
                      calculateTax(ordereditems, user?.tax?.gstPercentage)
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
    </>
  );
}

{
  /* <Drawer open={isSpecialRequestsOpen} onOpenChange={setIsSpecialRequestsOpen}>
  <DrawerContent className="h-auto max-h-[80vh] p-0">
    <div className="flex flex-col h-full">
      <DrawerHeader className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <DrawerTitle className="text-lg font-semibold">
            Add special instructions
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpecialRequestsClear}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </DrawerHeader>

      <div className="flex-1 px-6 py-4">
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Start typing instructions"
              value={tempSpecialRequirements}
              onChange={(e) => setTempSpecialRequirements(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={200}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {tempSpecialRequirements.length}/200
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Order instructions are provided for convenience, but merchant
            adherence cannot be guaranteed. No refunds/cancellations is
            possible.
          </p>
        </div>
      </div>

      <DrawerFooter className="px-6 py-4 border-t bg-background">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSpecialRequestsCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSpecialRequestsAdd}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            ADD
          </Button>
        </div>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>; */
}
