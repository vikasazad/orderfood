"use client";
import "./globals.css";
import { Provider } from "react-redux";
import store, { AppStore } from "../lib/store";

import { DM_Sans } from "next/font/google";
import { useRef } from "react";
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = store();
  }
  return (
    <html lang="en" className={dmSans.className}>
      <body>
        <main>
          <Provider store={storeRef.current}>{children}</Provider>
        </main>
      </body>
    </html>
  );
}
