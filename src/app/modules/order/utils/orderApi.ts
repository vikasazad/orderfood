import { db } from "@/config/db/firebase";
import { sendNotification } from "@/lib/sendNotification";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface AssignmentRequest {
  staffName: string;
  orderId: string;
  staffContact: string;
  messageId: string;
  timestamp: number;
  attemptCount: number;
  customerName: string;
  roomNumber: string;
  status: "pending" | "accepted" | "declined" | "timeout";
  businessEmail: string;
}

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
              type: orderData.discountType || "none",
              amount: orderData.discountAmount || 0,
              code: orderData.discountCode || "",
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
    location: orderData.tableNo || "",
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
          staffMember.status === "online" && staffMember.role === "concierge"
      )
      .map((staffMember: any) => ({
        name: staffMember.name,
        notificationToken: staffMember.notificationToken,
        orders: staffMember.orders,
        contact: staffMember.contact,
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
      (staffMember: any) => staffMember.name === attendantName
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

export async function addKitchenOrder(
  email: string,
  orderId: string,
  customerName: string,
  items: any[],
  price: number
) {
  try {
    // Reference to the Firestore document containing kitchen orders
    const docRef = doc(db, email, "hotel");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // If kitchen document doesn't exist, create it with initial structure
      await setDoc(docRef, {
        orders: {},
      });
    }

    const kitchenData = docSnap.exists()
      ? docSnap.data().kitchen
      : { orders: {} };

    // Generate a unique order ID if not provided

    // Create the new order object with required fields
    const newOrder = {
      id: orderId,
      customerName: customerName,
      status: "New",
      items: items,
      createdAt: new Date().toString(),
      startedAt: null,
      completedAt: null,
      totalAmount: price,
      preparationTimeMinutes: null,
    };

    // Add the new order to the kitchen orders
    const updatedOrders = {
      [orderId]: newOrder,
      ...kitchenData.orders,
    };

    // Update the document with the new order
    await updateDoc(docRef, {
      "kitchen.orders": updatedOrders,
    });

    console.log("Kitchen order added successfully");
    return true;
  } catch (error) {
    console.error("Error adding kitchen order: ", error);
    return false;
  }
}

export async function sendWhatsAppMessage(
  phoneNumber: string,
  variables: string[]
) {
  try {
    // Format phone number - remove any special characters and ensure proper format
    console.log("phoneNumber", phoneNumber, variables);
    const formattedPhone = phoneNumber.replace(/\D/g, "");

    const response = await fetch(
      `https://graph.facebook.com/v22.0/616505061545755/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_WHATSAPP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "template",
          template: {
            name: "order_confirmation",
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: variables.map((value) => ({
                  type: "text",
                  text: String(value),
                })),
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();
    console.log("WhatsApp API Response:", data); // Add logging for debugging

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send message");
    }

    return { success: true, message: "Message sent successfully!", data };
  } catch (error: any) {
    console.error("WhatsApp API Error:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
}

export async function sendStaffAssignmentRequest(
  staffName: string,
  staffContact: string,
  orderId: string,
  customerName: string,
  roomNumber: string,
  assignmentType: "room" | "table" = "room"
) {
  try {
    console.log(
      "sendStaffAssignmentRequest",
      staffName,
      staffContact,
      orderId,
      customerName,
      roomNumber,
      assignmentType
    );

    // Check if staff already has too many pending assignments
    // const pendingAssignments = await getAllPendingAssignmentsForStaff(
    //   staffContact
    // );
    // if (pendingAssignments.length >= 3) {
    //   // Limit to 3 pending assignments per staff
    //   console.log("Staff has too many pending assignments:", staffContact);
    //   return {
    //     success: false,
    //     message: "Staff has too many pending assignments",
    //   };
    // }

    // Check if this order is already assigned to someone
    // const existingAssignment = await getPendingAssignment(orderId);
    // if (existingAssignment && existingAssignment.status === "pending") {
    //   console.log("Order already has a pending assignment:", orderId);
    //   return {
    //     success: false,
    //     message: "Order already has a pending assignment",
    //   };
    // }
    console.log("data", {
      staffName,
      staffContact,
      orderId,
      customerName,
      roomNumber,
      assignmentType,
    });
    const formattedPhone = staffContact.replace(/\D/g, "");
    const response = await fetch(
      `https://graph.facebook.com/v22.0/616505061545755/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_WHATSAPP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text:
                `New ${
                  assignmentType === "room" ? "Room" : "Table"
                } Assignment\n\n` +
                `Customer: ${customerName}\n` +
                `${
                  assignmentType === "room" ? "Room" : "Table"
                }: ${roomNumber}\n` +
                `Order ID: ${orderId}\n\n` +
                `Please accept this assignment to proceed.`,
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: {
                    id: `accept_${orderId}`,
                    title: "Accept Request",
                  },
                },
                {
                  type: "reply",
                  reply: {
                    id: `decline_${orderId}`,
                    title: "Decline",
                  },
                },
              ],
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.messages && data.messages[0]) {
      const messageId = data.messages[0].id;

      // Store pending assignment with status
      await storePendingAssignment({
        staffName,
        orderId,
        staffContact,
        messageId,
        timestamp: Date.now(),
        attemptCount: 1,
        customerName,
        roomNumber,
        status: "pending",
        businessEmail: "vikumar.azad@gmail.com", // Set the proper business email
      });

      console.log("initial pendingAssignments stored in database");

      // Set timeout using configurable duration
      setTimeout(() => {
        handleAssignmentTimeout(orderId);
      }, 7 * 60 * 1000);

      return { success: true, messageId };
    }

    throw new Error(data.error?.message || "Failed to send message");
  } catch (error: any) {
    console.error("WhatsApp Assignment Error:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
}

async function storePendingAssignment(assignment: AssignmentRequest) {
  try {
    // Store assignment as a field within the webhook document
    const businessEmail = assignment.businessEmail || "vikumar.azad@gmail.com";
    const docRef = doc(db, businessEmail, "webhook");

    // Get existing webhook document
    const docSnap = await getDoc(docRef);
    let existingAssignments = {};

    if (docSnap.exists()) {
      existingAssignments = docSnap.data() || {};
    }

    // Add the new assignment
    const updatedAssignments = {
      ...existingAssignments,
      [assignment.orderId]: {
        ...assignment,
        status: assignment.status || "pending",
        timestamp: Date.now(),
      },
    };

    await setDoc(docRef, updatedAssignments);
    console.log("Pending assignment stored:", assignment.orderId);
  } catch (error) {
    console.error("Error storing pending assignment:", error);
  }
}

async function handleAssignmentTimeout(orderId: string) {
  try {
    //In this we are only sending notification to the receptionist not the manager
    const assignment = await getPendingAssignment(orderId);

    if (!assignment || assignment.status !== "pending") {
      return; // Assignment was already handled or is not pending
    }

    // Update assignment status to timeout
    await updateAssignmentStatus(orderId, "timeout");

    // Mark staff as inactive after timeout
    await markStaffInactive(assignment.staffContact);

    // Send message to staff about timeout
    await sendWhatsAppTextMessage(
      assignment.staffContact,
      "Assignment request timed out. You have been marked as inactive. Send 'active' to become available for new assignments."
    );

    // Notify receptionists about timeout
    await notifyReceptionists(
      "Assignment Timeout",
      `Assignment for order ${orderId} has timed out. Staff marked as inactive. Please reassign manually.`
    );

    // If this was the first attempt, try to find another staff member
    // if (assignment.attemptCount === 1) {
    //   const nextStaff = await getNextAvailableStaff(assignment.staffContact);

    //   if (nextStaff) {
    //     // Send notification to next staff member
    //     await sendStaffAssignmentRequest(
    //       nextStaff.contact,
    //       orderId,
    //       assignment.customerName,
    //       assignment.roomNumber,
    //       "room"
    //     );

    //     // Create new assignment with incremented attempt count
    //     const updatedAssignment = {
    //       ...assignment,
    //       attemptCount: 2,
    //       staffContact: nextStaff.contact,
    //       status: "pending",
    //     };
    //     await storePendingAssignment(updatedAssignment);
    //   }
    // }

    // Notify admin about unassigned order
    // await notifyAdminUnassignedOrder(orderId);
  } catch (error) {
    console.error("Error handling assignment timeout:", error);
  }
}

async function getPendingAssignment(
  orderId: string
): Promise<AssignmentRequest | null> {
  try {
    // Get assignment from webhook document
    const businessEmail = "vikumar.azad@gmail.com";
    const docRef = doc(db, businessEmail, "webhook");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const assignments = docSnap.data();
      if (assignments && assignments[orderId]) {
        return assignments[orderId] as AssignmentRequest;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting pending assignment:", error);
    return null;
  }
}

async function updateAssignmentStatus(
  orderId: string,
  status: AssignmentRequest["status"]
) {
  try {
    // Update assignment status in webhook document
    const businessEmail = "vikumar.azad@gmail.com";
    const docRef = doc(db, businessEmail, "webhook");

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const assignments = docSnap.data();
      if (assignments && assignments[orderId]) {
        const updatedAssignments = {
          ...assignments,
          [orderId]: {
            ...assignments[orderId],
            status: status,
            updatedAt: Date.now(),
          },
        };

        await setDoc(docRef, updatedAssignments);
        console.log(`Assignment ${orderId} status updated to ${status}`);
      }
    }
  } catch (error) {
    console.error("Error updating assignment status:", error);
  }
}

async function markStaffInactive(phoneNumber: string) {
  try {
    const businessEmails = await findBusinessWithStaff(phoneNumber);

    for (const businessEmail of businessEmails) {
      const docRef = doc(db, businessEmail, "info");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const staff = data.staff || [];

        const updatedStaff = staff.map((member: any) => {
          if (member.contact === phoneNumber) {
            return {
              ...member,
              active: false,
              lastInactiveTime: new Date().toISOString(),
            };
          }
          return member;
        });

        await updateDoc(docRef, { staff: updatedStaff });
        console.log(`Staff ${phoneNumber} marked as inactive`);
      }
    }
  } catch (error) {
    console.error("Error marking staff inactive:", error);
  }
}

export async function sendWhatsAppTextMessage(
  phoneNumber: string,
  message: string
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/616505061545755/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_WHATSAPP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        }),
      }
    );

    await response.json();
    return response.ok;
  } catch (error) {
    console.error("Error sending WhatsApp text message:", error);
    return false;
  }
}

async function notifyReceptionists(title: string, message: string) {
  try {
    const tokens = await getReceptionistTokens();

    for (const token of tokens) {
      await sendNotification(token, title, message);
    }

    console.log(`Notifications sent to ${tokens.length} receptionists`);
  } catch (error) {
    console.error("Error notifying receptionists:", error);
  }
}

async function getReceptionistTokens(): Promise<string[]> {
  try {
    const businessEmails = "vikumar.azad@gmail.com";
    const tokens: string[] = [];

    for (const businessEmail of businessEmails) {
      const docRef = doc(db, businessEmail, "info");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const staff = data.staff || [];

        const receptionists = staff.filter(
          (member: any) =>
            member.role === "receptionist" &&
            member.notificationToken &&
            member.status === "online"
        );

        receptionists.forEach((receptionist: any) => {
          if (receptionist.notificationToken) {
            tokens.push(receptionist.notificationToken);
          }
        });
      }
    }

    return tokens;
  } catch (error) {
    console.error("Error getting receptionist tokens:", error);
    return [];
  }
}

async function findBusinessWithStaff(_phoneNumber: string): Promise<string[]> {
  console.log("findBusinessWithStaff", _phoneNumber);
  // This is a simplified implementation
  // In production, you might want to maintain an index or search more efficiently
  return ["vikumar.azad@gmail.com"]; // Return known business emails for now
}
