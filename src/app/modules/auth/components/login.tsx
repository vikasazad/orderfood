"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authPhoneOtp, resendOtp, verifyOtp } from "@/lib/auth/handleOtp";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { useRouter, useSearchParams } from "next/navigation";
// Custom hook for countdown timer
const useCountdown = (initialCount: number) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return [count, setCount] as const;
};

export default function Login() {
  const router = useRouter();
  const [fNumber, setFNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [count, setCount] = useCountdown(30);
  const searchParams = useSearchParams();

  const data = searchParams.get("data"); // Base64 encoded restaurant ID
  const table = searchParams.get("table"); // Base64 encoded table number

  // Decode base64 data
  const restaurantId = data ? atob(data) : null;
  const tableNumber = table ? atob(table) : null;
  console.log(restaurantId, tableNumber);

  if (!restaurantId || !tableNumber) {
    return <p>Invalid parameters. Please scan the QR code again.</p>;
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedNumber = `+${91}${phoneNumber}`;
      console.log("Formatted phone number:", formattedNumber);
      console.log("Sending OTPs to email and phone...");
      setFNumber(formattedNumber);
      const phoneOtpRes: any = await authPhoneOtp(formattedNumber);
      console.log("phoneOtpRes:", phoneOtpRes);
      setVerificationId(phoneOtpRes.verificationId);
      setStage("otp");
      setCount(30);
    } catch (error) {
      toast.error("Something went wrong");
      console.error("Error in handleRegisterSubmit:", error);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("handleOtpSubmit called with values:", otp);

    try {
      console.log("Verifying phone OTP...");
      const phoneVerified = await verifyOtp(verificationId, otp);
      console.log("phoneVerified:", phoneVerified);

      if (!phoneVerified) {
        toast.error("Invalid phone OTP");
        console.log("Invalid phone OTP");
        return;
      }

      toast.success("Registration successful!");
      console.log("User registration successful!");

      router.push(`/?restaurantId=${data}&table=${table}`);
    } catch (error) {
      toast.error("Verification failed");
      console.error("Error in handleOtpSubmit:", error);
    } finally {
      setIsLoading(false);
      console.log("handleOtpSubmit process finished.");
    }
    console.log("OTP submitted:", otp);
  };

  const handleResendOtp = async () => {
    try {
      console.log("Resending OTPs...");
      const phoneOtpRes: any = await resendOtp(fNumber);
      console.log("phoneOtpRes:", phoneOtpRes);

      if (phoneOtpRes) {
        setVerificationId(phoneOtpRes.verificationId);
        setCount(30);
        toast.success("OTPs resent successfully");
        console.log(
          "OTPs resent successfully. Verification ID:",
          phoneOtpRes.verificationId
        );
      }
    } catch (error) {
      toast.error("Failed to resend OTPs");
      console.error("Error in handleResendOtp:", error);
    }
    // Reset the countdown
  };

  return (
    <>
      <Suspense fallback={<p>Loading...</p>}>
        <div id="recaptcha-container" />

        <div className="grid min-h-screen place-items-center bg-gray-50">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Welcome to Food Order</CardTitle>
              <CardDescription>Please authenticate to continue</CardDescription>
            </CardHeader>
            <CardContent>
              {stage === "phone" ? (
                <form onSubmit={handlePhoneSubmit}>
                  <div className="flex flex-col space-y-4">
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    <Button type="submit">Send OTP</Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit}>
                  <div className="flex flex-col space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <div className="text-sm text-gray-500">
                      {count > 0
                        ? `Resend OTP in ${count}s`
                        : "You can resend OTP now"}
                    </div>
                    <Button type="submit">Verify OTP</Button>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter>
              {stage === "otp" && (
                <Button
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={count > 0}
                >
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Resend OTP
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </Suspense>
    </>
  );
}
