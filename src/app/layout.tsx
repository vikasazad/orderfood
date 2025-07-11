"use client";
import "./globals.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { AppStore } from "../lib/store";
import { DM_Sans } from "next/font/google";
import { useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import GlobalNotificationProvider from "@/hooks/useFcmToken";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<{ store: AppStore; persistor: any }>();
  if (!storeRef.current) {
    storeRef.current = store();
  }

  return (
    <html lang="en" className={dmSans.className}>
      <body>
        <main>
          <Provider store={storeRef.current.store}>
            <PersistGate
              loading={
                <div className="flex justify-center items-center h-screen">
                  <div className="text-lg font-medium">Loading...</div>
                </div>
              }
              persistor={storeRef.current.persistor}
            >
              <GlobalNotificationProvider>
                <Toaster />
                {children}
              </GlobalNotificationProvider>
            </PersistGate>
          </Provider>
        </main>
      </body>
    </html>
  );
}
