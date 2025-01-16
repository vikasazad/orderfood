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

export async function sendOrder(orderData: any, token: string, attendant: any) {
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
          attendant: attendant.name,
          attendantToken: attendant.token,
          status: "Order placed",
          timeOfRequest: new Date().toISOString(),
          timeOfFullfilment: "",
          payment: {
            transctionId: orderData.razorpayOrderId || "",
            paymentStatus: "paid",
            paymentType: "single",
            mode: "online",
            paymentId: orderData.razorpayPaymentId || "",
            subtotal: orderData.subtotal,
            price: orderData.orderAmount || 0,
            priceAfterDiscount: "",
            timeOfTransaction: new Date().toISOString(),
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
      attendant: attendant.name || "",
      attendantToken: attendant.token || "",
      timeSeated: new Date().toISOString(),
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
        attendant: attendant.name || "",
        attendantToken: attendant.token,
        bookingId: "",
        payment: {
          paymentStatus: "paid",
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
export async function sendHotelOrder(
  orderData: any,
  attendant: any,
  roomNo: string
) {
  console.log("HERE");

  const newOrder = {
    orderId: orderData.orderId,
    specialRequirement: orderData.specialrequirements || "",
    items: orderData.orderedItem || [],
    attendant: attendant.name,
    attendantToken: attendant.token || "",
    status: "Order placed",
    timeOfRequest: new Date().toISOString(),
    timeOfFullfilment: "",
    payment: {
      transctionId: orderData.razorpayOrderId || "",
      paymentStatus: "paid",
      paymentType: "single",
      mode: "online",
      paymentId: orderData.razorpayPaymentId || "",
      subtotal: orderData.subtotal,
      price: orderData.orderAmount || 0,
      priceAfterDiscount: "",
      timeOfTransaction: new Date().toISOString(),
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
  };

  const newTransaction = {
    location: orderData.tableNo || "",
    against: orderData.orderId || "",
    attendant: attendant.name || "",
    attendantToken: attendant.token || "",
    bookingId: "",
    payment: {
      paymentStatus: "paid",
      mode: "online",
      paymentId: orderData.razorpayPaymentId || "",
      timeOfTransaction: new Date().toISOString(),
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
  };

  const docRef = doc(db, "vikumar.azad@gmail.com", "hotel");
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const rooms = data?.live?.rooms || [];

      let roomFound = false;

      // Iterate over rooms to find the matching roomNo
      for (const room of rooms) {
        if (room.bookingDetails?.location === roomNo) {
          roomFound = true;

          // Add the new order to diningDetails.orders
          room.diningDetails.orders = [
            ...(room.diningDetails.orders || []),
            newOrder,
          ];

          room.diningDetails.attendant = attendant.name;
          room.diningDetails.attendantToken = attendant.token || "";
          room.diningDetails.timeOfRequest = new Date().toISOString();

          // Add the new transaction
          room.transctions = [...(room.transctions || []), newTransaction];

          console.log(`Updates applied for roomNo: ${roomNo}`);
        }
      }

      if (!roomFound) {
        console.error(`No room found with roomNo: ${roomNo}`);
      }

      console.log("room found", rooms);

      // Save the updated data back to Firestore
      await updateDoc(docRef, { "live.rooms": rooms });
      console.log("Data updated successfully.");
    } else {
      console.error("Document does not exist.");
    }
  } catch (error) {
    console.error("Error updating order:", error);
  }
}

export async function getOnlineStaffFromFirestore(email: string) {
  const docRef = doc(db, email, "info");

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error("Document not found");
      throw new Error("Document not found");
    }

    const info = docSnap.data().staff;

    if (!info) {
      console.error("Invalid info object or staff list.");
      throw new Error("Invalid info object or staff list.");
    }

    const onlineStaff = info
      .filter(
        (staffMember: any) =>
          staffMember.status === "online" && staffMember.role === "attendant"
      )
      .map((staffMember: any) => ({
        name: staffMember.name,
        notificationToken: staffMember.notificationToken,
        orders: staffMember.orders,
      }));

    return assignAttendantSequentially(onlineStaff);
  } catch (error) {
    console.error("Error fetching document: ", error);
    throw error;
  }
}

interface StaffMember {
  name: string;
  token: string;
  orders: string[];
}

export function assignAttendantSequentially(
  availableStaff: StaffMember[]
): StaffMember | null {
  if (availableStaff.length === 0) return null;

  // Sort staff by number of current orders (ascending)
  const sortedStaff = [...availableStaff].sort(
    (a, b) => a.orders.length - b.orders.length
  );

  // Return the staff with the least number of orders
  return sortedStaff[0];
}

export async function updateOrdersForAttendant(
  attendantName: string,
  orderId: string
) {
  try {
    // Reference to the Firestore document containing staff info
    const docRef = doc(db, "vikumar.azad@gmail.com", "info");

    // Fetch the document to get the current staff data
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error("Document not found");
      return;
    }

    const staff = docSnap.data().staff;

    if (!staff) {
      console.error("Invalid staff data");
      return;
    }

    // Find the attendant by name
    const attendantIndex = staff.findIndex(
      (staffMember: any) =>
        staffMember.name === attendantName && staffMember.role === "attendant"
    );

    if (attendantIndex === -1) {
      console.error("Attendant not found");
      return;
    }

    // Add the new orderId to the attendant's orders array
    staff[attendantIndex].orders.push(orderId);
    // console.log("staff", staff);

    // Update the document with the modified staff array
    await updateDoc(docRef, {
      staff: staff,
    });

    console.log("Order added successfully");
  } catch (error) {
    console.error("Error updating orders: ", error);
  }
}

export async function removeTableByNumber(email: string, tableNo: string) {
  const docRef = doc(db, email, "restaurant");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const tableDetails = docSnap.data().live.tablesData.tableDetails;

    // Iterate through each category and remove the table
    const updatedTableDetails = Object.keys(tableDetails).reduce(
      (result: any, category: string) => {
        result[category] = tableDetails[category].filter(
          (table: any) => table.location !== tableNo
        );
        return result;
      },
      {}
    );

    console.log("updatedTableDetails", updatedTableDetails);

    // Update the document in Firestore
    await updateDoc(docRef, {
      "live.tablesData.tableDetails": updatedTableDetails,
    });

    console.log(`Table ${tableNo} has been removed.`);
    return true;
  } else {
    console.log("Document does not exist.");
    return false;
  }
}
