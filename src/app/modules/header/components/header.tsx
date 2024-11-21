"use client";

import * as React from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export default function Header({ data }: { data: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const finalItem = useSelector(
    (state: RootState) => state.addToOrderData.finalOrder
  );

  console.log(finalItem);
  const [expanded, setExpanded] = React.useState(false);
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([
    { name: "Xiao Long Bao", quantity: 1, price: 499.0 },
  ]);
  const [specialInstructions, setSpecialInstructions] = React.useState("");

  const updateQuantity = (index: number, increment: boolean) => {
    setOrderItems((items) =>
      items
        .map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: increment
                  ? item.quantity + 1
                  : Math.max(0, item.quantity - 1),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <header className="mx-auto max-w-2xl px-2">
      <div className="flex items-center justify-between py-2">
        <Sheet>
          <SheetTrigger asChild>
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarImage alt="Restaurant logo" src={data.logo} />
            </Avatar>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[350px] sm:w-[350px] overflow-y-auto"
          >
            <SheetHeader className="mb-6 space-y-0 pb-2">
              <SheetTitle className="text-xl">Order Summary</SheetTitle>
            </SheetHeader>
            <SheetDescription></SheetDescription>
            {finalItem.orderId ? (
              <>
                <div className="grid gap-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Order Number:
                      </span>
                      <span>{finalItem.orderId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span>{finalItem.razorpayPaymentId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Estimated Delivery:
                      </span>
                      <span>30-45 minutes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Delivery Address:
                      </span>
                      <span>123 Main St, Anytown, USA</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-base">Order Items</h3>
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 py-2"
                      >
                        <span className="flex-1 text-sm">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, false)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => updateQuantity(index, false)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <span className="w-20 text-right text-sm">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-base">
                      Special Instructions
                    </h3>
                    <Textarea
                      placeholder="Add any special requirements here..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-between py-2">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p>Welcome to restaurant please order and enjoy</p>
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
              expanded ? "w-full opacity-100" : "w-0 opacity-0"
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
