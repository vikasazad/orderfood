import React from "react";
import { Badge } from "@/components/ui/badge";

const StatusChip = ({ status }: { status: string }) => {
  const stat = status?.toLowerCase() || "Error";
  const statusStyles: any = {
    available: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(22, 119, 255)",
    },
    reserved: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(255, 77, 79)",
    },
    booked: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(255, 77, 79)",
    },
    occupied: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(82, 196, 26)",
    },
    cleaning: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(63, 81, 181)",
    },
    "checked out": {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(22, 119, 255)",
    },
    "checking in": {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(22, 119, 255)",
    },
    upgraded: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(205, 220, 57)",
    },
    paid: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(233, 30, 99)",
    },
    ordering: {
      color: "rgb(19, 194, 194)",
      backgroundColor: "rgb(230, 255, 251)",
      borderColor: "rgb(92, 219, 211)",
    },
    "order placed": {
      color: "rgb(194, 194, 19)",
      backgroundColor: "rgb(255, 251, 230)",
      borderColor: "rgb(219, 211, 92)",
    },
    "in progress": {
      color: "rgb(140, 19, 194)",
      backgroundColor: "rgb(251, 230, 255)",
      borderColor: "rgb(166, 92, 219)",
    },
    served: {
      color: "rgb(82, 196, 26)",
      backgroundColor: "rgb(246, 255, 237)",
      borderColor: "rgb(149, 222, 100)",
    },
    billed: {
      color: "rgb(250, 173, 20)",
      backgroundColor: "rgb(255, 251, 230)",
      borderColor: "rgb(255, 214, 102)",
    },
    pending: {
      color: "rgb(19, 34, 94)",
      backgroundColor: "rgb(230, 230, 251)",
      borderColor: "rgb(92, 102, 158)",
    },
    cancelled: {
      color: "rgb(255, 77, 79)",
      backgroundColor: "rgb(255, 241, 240)",
      borderColor: "rgb(255, 163, 158)",
    },
    requested: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(22, 119, 255)",
    },
    accepted: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(63, 81, 181)",
    },
    denied: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(255, 77, 79)",
    },
    completed: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(82, 196, 26)",
    },
    opened: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(22, 119, 255)",
    },
    assigned: {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(63, 81, 181)",
    },
    "fixing required": {
      color: "rgb(255, 255, 255)",
      backgroundColor: "rgb(255, 77, 79)",
    },
  };

  const defaultStyle = {
    color: "rgb(0, 0, 0)",
    backgroundColor: "rgb(240, 240, 240)",
  };

  const style = statusStyles[status] || defaultStyle;

  return (
    <div>
      <Badge
        style={{
          ...style,
        }}
      >
        {stat}
      </Badge>
    </div>
  );
};

export default StatusChip;
