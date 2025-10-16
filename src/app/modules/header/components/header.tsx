"use client";

import React, { useState, useEffect } from "react";
import { IndianRupee, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { searchTerm } from "@/lib/features/searchSlice";
import { AppDispatch, RootState } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
// import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  createOrder,
  getOrderData,
  getOrderDataHotel,
} from "../../auth/utils/authApi";
import { Badge } from "@/components/ui/badge";
import Script from "next/script";

export default function Header({ data }: { data: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.addToOrderData);
  console.log("HERETHEDATA", user);
  const [expanded, setExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [orderData, setOrderData] = useState<any>([]);
  const [orderSelectedItems, setOrderSelectedItems] = useState<{
    [orderId: string]: string[];
  }>({});

  const [loadScript, setLoadScript] = useState(false);
  const [open, setOpen] = useState(false);
  console.log("user", user, localStorage.getItem("phone"));
  useEffect(() => {
    console.log("h0");
    const phone = localStorage.getItem("phone") || user?.phone;
    if (!user?.email || !phone) {
      console.log("Email or phone is missing in table data.");
      return;
    }
    if (user?.tag === "concierge") {
      console.log("h1");
      const unsubscribe = getOrderDataHotel(
        user.email,
        phone,
        (result: any) => {
          if (result) {
            setOrderData(result);
          } else {
            setOrderData([]);
          }
        }
      );

      return () => {
        if (unsubscribe) unsubscribe(); // Ensure cleanup
      };
    } else {
      console.log("here in restaurant");
      if (user.email && phone) {
        console.log("h2");
        const unsubscribe = getOrderData(
          user.email,
          phone,

          (result: any) => {
            console.log("result1", result);
            if (result) {
              console.log("result2", result);
              setOrderData(result);
            } else {
              setOrderData([]);
            }
          }
        );

        return () => {
          if (unsubscribe) unsubscribe(); // Ensure cleanup
        };
      }
    }
  }, [user.email]);

  console.log("staff", orderData);
  console.log("DATA", orderSelectedItems);
  // const handleItemSelect = (orderId: string, itemId: string) => {
  //   setOrderSelectedItems((prevSelectedItems) => {
  //     const updatedSelectedItems = {
  //       ...prevSelectedItems,
  //       [orderId]: prevSelectedItems[orderId]
  //         ? prevSelectedItems[orderId].includes(`${itemId}`)
  //           ? prevSelectedItems[orderId].filter((id) => id !== `${itemId}`)
  //           : [...prevSelectedItems[orderId], `${itemId}`]
  //         : [`${itemId}`],
  //     };
  //     return updatedSelectedItems;
  //   });
  // };

  // const handleCancelSelected = (orderId: string) => {
  //   if (orderSelectedItems[orderId]?.length > 0) {
  //     setIsDialogOpen(true);
  //   }
  // };

  const handleConfirmCancellation = () => {
    console.log({
      reason: selectedReason,
      notes: additionalNotes,
    });
    // const updatedOrderData = orderData.map((order: any) => {
    //   const updatedOrders = order.diningDetails.orders.map((orderItem: any) => {
    //     const filteredItems = orderItem.items.filter(
    //       (item: any) =>
    //         !orderSelectedItems[orderItem.orderId]?.includes(`${item.id}`)
    //     );

    //     return {
    //       ...orderItem,
    //       items: filteredItems,
    //     };
    //   });

    //   return {
    //     ...order,
    //     diningDetails: {
    //       ...order.diningDetails,
    //       orders: updatedOrders,
    //     },
    //   };
    // });

    // setOrderData(updatedOrderData);
    setOrderSelectedItems({});
    setIsDialogOpen(false);
    setSelectedReason("");
    setAdditionalNotes("");
  };

  function calculateGrandTotal() {
    const result: any = {
      amount: 0,
      status: "Paid",
      pendingOrders: [],
      totalPendingGstAmount: 0,
    };

    orderData.forEach((order: any) => {
      if (order.diningDetails && order.diningDetails.orders) {
        order.diningDetails.orders.forEach((orderItem: any) => {
          const payment = orderItem.payment;

          if (payment.paymentStatus === "pending") {
            // Update result if there are pending payments
            result.status = "Pending";
            result.amount += payment.price; // Accumulate pending amount
            result.pendingOrders.push({
              id: orderItem.orderId,
            }); // Collect pending order IDs

            // Add GST amount for pending orders
            if (payment.gst && payment.gst.gstAmount) {
              result.totalPendingGstAmount += payment.gst.gstAmount;
            }
          }
        });
      }
    });

    // If status remains "Paid", calculate the total paid amount
    if (result.status === "Paid") {
      result.amount = orderData.reduce((total: any, order: any) => {
        return (
          total +
          order?.diningDetails?.orders?.reduce(
            (subTotal: any, orderItem: any) => {
              return (
                subTotal +
                (orderItem.payment.paymentStatus === "paid"
                  ? orderItem.payment.price
                  : 0)
              );
            },
            0
          )
        );
      }, 0);
    }

    return result;
  }
  const handlePayment = () => {
    console.log("clicked");
    if (open) {
      setOpen(false);
    }
    const gstPercentage = user?.tax?.all;
    const { amount, status, pendingOrders, totalPendingGstAmount } =
      calculateGrandTotal();

    setLoadScript(true);
    createOrder(
      user.email,
      user.phone,
      user.tag,
      user.tableNo,
      orderData,
      amount,
      status,
      pendingOrders,
      totalPendingGstAmount,
      gstPercentage
    );
  };

  console.log("orderDAta", orderData);

  return (
    <>
      {loadScript && (
        <Script
          type="text/javascript"
          src="https://checkout.razorpay.com/v1/checkout.js"
        />
      )}
      <header className="mx-auto max-w-2xl px-2">
        <div className="flex items-center justify-between py-2 ">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Menu className="h-5 w-5" />
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[350px] sm:w-[350px] flex flex-col overflow-y-auto "
            >
              <SheetHeader className=" space-y-0 ">
                <SheetTitle className="text-xl">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarImage alt="Restaurant logo" src={data.logo} />
                      </Avatar>
                      <h1 className="text-lg font-semibold">
                        {data.name || "Restaurant Name"}
                      </h1>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {orderData.length > 0 ? (
                <>
                  <div className="text-lg">Order Summary:</div>
                  {orderData?.map((order: any, i: any) => {
                    console.log(order);
                    return order.diningDetails.orders.map(
                      (item: any, itemIndex: number) => {
                        return (
                          <div key={`${i}-${itemIndex}`}>
                            <Separator />
                            <div className="grid gap-2">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm mt-2">
                                  <span className="text-muted-foreground">
                                    Order Number:
                                  </span>
                                  <span className="font-medium">
                                    {item.orderId}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Payment ID:
                                  </span>
                                  <span className="font-medium">
                                    {item.payment.paymentId}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Estimated Delivery:
                                  </span>
                                  <span className="font-medium">
                                    20-25 minutes
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Table:
                                  </span>
                                  <span className="font-medium text-right">
                                    {`T-${orderData[0].diningDetails.location}`}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold">Order Items</h3>
                                  {/* <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleCancelSelected(item.orderId)
                                    }
                                    disabled={
                                      !orderSelectedItems[item.orderId] ||
                                      orderSelectedItems[item.orderId].length ===
                                        0
                                    }
                                  >
                                    Cancel Selected
                                  </Button> */}
                                </div>

                                <div className="divide-y">
                                  {item.items.map((itm: any, index: number) => {
                                    console.log("itm", itm);
                                    return (
                                      <div
                                        key={index}
                                        className=" flex items-center gap-4"
                                      >
                                        {/* <Checkbox
                                        checked={orderSelectedItems[
                                          item.orderId
                                        ]?.includes(`${itm.id}`)}
                                        onCheckedChange={() =>
                                          handleItemSelect(item.orderId, itm.id)
                                        }
                                      /> */}
                                        <div className="flex-1">
                                          <div className="font-medium">
                                            {itm.name}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Quantity: {itm.quantity}
                                          </div>
                                        </div>
                                        <div className="font-medium flex items-center ">
                                          <IndianRupee className="h-3 w-3" />
                                          {Number(itm.price)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>


                              
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  Savings using{" "}
                                  <span className="text-purple-300 tracking-wider">
                                    {item.payment.discount?.code}
                                  </span>
                                </span>
                                <div className="text-sm font-semibold flex items-center  text-green-500">
                                  -
                                  <IndianRupee
                                    className="h-3 w-3"
                                    strokeWidth={3}
                                  />
                                  <span className="text-sm ">
                                    {item.payment.discount?.amount || 0}
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-4 border-t">
                                <span className="text-lg font-semibold">
                                  Subtotal
                                </span>
                                <span className="text-lg font-semibold flex items-center ">
                                  <IndianRupee className="h-3 w-3" />
                                  {item.payment.subtotal}
                                </span>
                              </div>
                              {item.payment.gst.gstAmount ? (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    {`Tax (${item.payment.gst.gstPercentage}%)`}
                                  </span>
                                  <span className="text-sm font-medium flex items-center ">
                                    <IndianRupee className="h-3 w-3" />
                                    {item.payment.gst.gstAmount}
                                  </span>
                                </div>
                              ) : (
                                ""
                              )}

                              <div className="flex justify-between items-center pt-4 border-t">
                                <div className="flex items-center">
                                  <span className="text-lg font-semibold mr-2">
                                    Total
                                  </span>
                                  {item.payment.paymentStatus === "paid" ? (
                                    <Badge>Paid</Badge>
                                  ) : (
                                    <Badge>Pending</Badge>
                                  )}
                                </div>

                                <span className="text-lg font-semibold flex items-center ">
                                  <IndianRupee className="h-3 w-3" />
                                  {item.payment.price}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    );
                  })}

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="w-[90%] p-5 ">
                      <DialogHeader>
                        <DialogTitle>Cancel Order Items</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for cancelling the selected
                          items.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="reason">
                            Reason for cancellation
                          </Label>
                          <Select
                            value={selectedReason}
                            onValueChange={setSelectedReason}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="changed-mind">
                                Changed my mind
                              </SelectItem>
                              <SelectItem value="wrong-item">
                                Ordered wrong item
                              </SelectItem>
                              <SelectItem value="too-expensive">
                                Too expensive
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Please provide any additional details..."
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex flex-col justify-between">
                        <Button
                          variant="destructive"
                          onClick={handleConfirmCancellation}
                          disabled={!selectedReason}
                        >
                          Confirm Cancellation
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="mt-4"
                        >
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <p>Welcome to {data.name} please order and enjoy</p>
              )}
              <SheetDescription></SheetDescription>
              {orderData?.diningDetails?.length > 0 && (
                <SheetFooter className="w-[320px] mt-auto p-4 bg-background border-t sticky bottom-[-25]">
                  <div className="w-full">
                    {(() => {
                      const { amount, status } = calculateGrandTotal();

                      return (
                        <>
                          {status === "Paid" ? (
                            <div className="flex  items-center mb-4">
                              <span className="text-xl font-bold mr-2">
                                Grand Total
                              </span>
                              <Badge className="bg-green-500 text-white mr-12">
                                Paid
                              </Badge>

                              <span className="text-xl font-bold flex items-center gap-1">
                                <IndianRupee
                                  className="h-3 w-3"
                                  strokeWidth={3}
                                />
                                {amount}
                              </span>
                            </div>
                          ) : (
                            <div className="flex  items-center justify-between mb-4">
                              <div className="flex ">
                                <span className="text-xl font-bold mr-2">
                                  Grand Total
                                </span>
                                <Badge className="bg-yellow-500 text-white ">
                                  Pending
                                </Badge>
                              </div>

                              <span className="text-xl font-bold flex items-center gap-1">
                                <IndianRupee
                                  className="h-3 w-3"
                                  strokeWidth={3}
                                />
                                {amount}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <Button
                      variant="default"
                      className="w-full"
                      disabled={calculateGrandTotal().status === "Paid"}
                      onClick={() => handlePayment()}
                    >
                      {calculateGrandTotal().status === "Paid"
                        ? "Payment Complete"
                        : "Pay Now"}
                    </Button>
                  </div>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>

          <div
            className={cn(
              "relative flex items-center gap-2 rounded-full bg-background transition-all duration-500 shadow-md hover:shadow-lg",
              expanded ? "w-[85%] px-3" : "h-10 w-10"
            )}
          >
            <Input
              className={cn(
                "border-none bg-transparent p-0 focus-visible:ring-0",
                expanded ? "w-full h-6 opacity-100" : "w-0 opacity-0"
              )}
              placeholder="Search anything"
              type="search"
              onChange={(e) => dispatch(searchTerm(e.target.value))}
            />
            <Button
              onClick={() => setExpanded(!expanded)}
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 rounded-full"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Toggle search</span>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
// "use client";

// import * as React from "react";
// import { Search } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { Avatar, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useDispatch } from "react-redux";
// import { searchTerm } from "@/lib/features/searchSlice";
// import { AppDispatch } from "@/lib/store";
// export default function Header({ data }: { data: any }) {
//   console.log(data);
//   const dispatch = useDispatch<AppDispatch>();
//   const [expanded, setExpanded] = React.useState(false);

//   return (
//     <header className="mx-auto max-w-6xl px-2">
//       <div className="flex items-center justify-between py-2">
//         <Avatar className="h-10 w-10">
//           <AvatarImage alt="Restaurant logo" src={data.logo} />
//         </Avatar>
//         <div
//           className={cn(
//             "relative flex items-center gap-2 rounded-full bg-background transition-all duration-500 shadow-md hover:shadow-lg ",
//             expanded ? "w-[85%] px-3" : "h-10 w-10"
//           )}
//         >
//           <Input
//             className={cn(
//               "border-none bg-transparent p-0 focus-visible:ring-0",
//               expanded ? "w-full opacity-100" : "w-0 opacity-0"
//             )}
//             placeholder="Search anything"
//             type="search"
//             onChange={(e) => dispatch(searchTerm(e.target.value))}
//           />
//           <Button
//             onClick={() => setExpanded(!expanded)}
//             size="icon"
//             variant="ghost"
//             className="h-6 w-6 shrink-0 rounded-full "
//           >
//             <Search className="h-4 w-4" />
//             <span className="sr-only">Toggle search</span>
//           </Button>
//         </div>
//       </div>
//     </header>
//   );
// }
