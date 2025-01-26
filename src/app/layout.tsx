"use client";
import "./globals.css";
import { Provider } from "react-redux";
import store, { AppStore } from "../lib/store";

import { DM_Sans } from "next/font/google";
import { useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import GlobalNotificationProvider from "@/hooks/useFcmToken";
import Head from "next/head";
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
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <body>
        <main>
          <Provider store={storeRef.current}>
            <GlobalNotificationProvider>
              <Toaster />
              {children}
            </GlobalNotificationProvider>
          </Provider>
        </main>
      </body>
    </html>
  );
}
