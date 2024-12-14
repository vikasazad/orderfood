import { db } from "@/config/db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export function calculateTotal(ordereditems: any) {
  return ordereditems.reduce((total: any, item: any) => {
    const price = item.item.price[item.selectedType];
    return total + price * item.count;
  }, 0);
}
export function calculateTax(ordereditems: any, tax: string) {
  const total = calculateTotal(ordereditems);
  const rounded = Math.round((total * Number(tax)) / 100);
  return rounded;
}

export async function sendOrder(
  orderData: any,
  token: string,
  attendant: string
) {
  console.log("HERE");
  const format = {
    diningDetails: {
      customer: {
        name: orderData.name,
        email: orderData.email,
        phone: orderData.contactNo,
        notificationToken: token,
      },
      orders: [
        {
          orderId: orderData.orderId,
          specialRequirement: orderData.specialrequirements || "",
          items: orderData.orderedItem || [],
          attendant: attendant,
          status: "Order placed",
          timeOfRequest: new Date(),
          timeOfFullfilment: "",
          payment: {
            transctionId: orderData.razorpayOrderId || "",
            paymentStatus: "success",
            paymentType: "single",
            mode: "online",
            paymentId: orderData.razorpayPaymentId || "",
            subtotal: orderData.subtotal,
            price: orderData.orderAmount || 0,
            priceAfterDiscount: "",
            timeOfTransaction: new Date(),
            gst: {
              gstAmount: orderData.gstAmount,
              gstPercentage: orderData.gstPercentage,
              cgstAmount: "",
              cgstPercentage: "",
              sgstAmount: "",
              sgstPercentage: "",
            },
            discount: {
              type: "none",
              amount: 0,
              code: "",
            },
          },
        },
      ],
      location: orderData.tableNo || "",
      attendant: attendant || "",
      timeSeated: new Date(),
      timeLeft: "",
      aggregator: "",
      aggregatorLogo: "",
      noOfGuests: "2",
      capicity: "4",
      status: "occupied",
    },
    issuesReported: {},
    transctions: [
      {
        location: orderData.tableNo || "",
        against: orderData.orderId || "",
        attendant: attendant || "",
        bookingId: "",
        payment: {
          paymentStatus: "complete",
          mode: "online",
          paymentId: orderData.razorpayPaymentId || "",
          timeOfTransaction: new Date(),
          price: orderData.orderAmount || 0,
          priceAfterDiscount: "",
          gst: {
            gstAmount: "",
            gstPercentage: "",
            cgstAmount: "",
            cgstPercentage: "",
            sgstAmount: "",
            sgstPercentage: "",
          },
          discount: {
            type: "",
            amount: "",
            code: "",
          },
        },
      },
    ],
  };

  // Sanitize the format object
  const sanitizedFormat = JSON.parse(
    JSON.stringify(format, (key, value) => (value === undefined ? null : value))
  );

  // console.log(
  //   "Sanitized format object:",
  //   JSON.stringify(sanitizedFormat, null, 2)
  // );

  const docRef = doc(db, "vikumar.azad@gmail.com", "restaurant");
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.live;
      const newArr = [sanitizedFormat, ...data.tables];
      await updateDoc(docRef, {
        "live.tables": newArr,
      });
    }
  } catch (error) {
    console.error("Error updating order:", error);
  }
}
