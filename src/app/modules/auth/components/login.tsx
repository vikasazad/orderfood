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
import { jwtVerify } from "jose";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { addUser } from "@/lib/features/addToOrderSlice";
import { checkTableAvailability } from "../utils/serverApi";
import TableOccupiedMessage from "@/components/ui/table-occupied-message";
// Custom hook for countdown timer
const useCountdown = (initialCount: number) => {
  const [count, setCount] = useState(0);

  const startCountdown = () => setCount(initialCount);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return [count, startCountdown] as const;
};

export default function Login() {
  const secretKey = "Vikas@1234";
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  // const [data, setData] = useState<any>({});
  const [fNumber, setFNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidTable, setIsValidTable] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [count, startCountdown] = useCountdown(30);
  const searchParams = useSearchParams();

  async function decodeUrl() {
    const token = searchParams.get("token");
    if (!token) {
      console.error("Token is missing in the URL");
      return null;
    }
    try {
      const key = new TextEncoder().encode(secretKey);
      const decoded: any = await jwtVerify(token, key, {
        algorithms: ["HS256"],
      });
      if (decoded?.payload?.tag === "restaurant") {
        const res = await checkTableAvailability(
          decoded?.payload.email,
          decoded?.payload.tableNo
        );
        console.log("res", res);
        setIsValidTable(res);
      }

      return decoded;
    } catch (error) {
      console.error("Invalid or expired token:", error);
      return null;
    }
  }
  const decodedData = decodeUrl();

  if (decodedData) {
    decodedData.then((data) => {
      console.log("Decoded Data:", data);
      if (data?.payload.tag === "hotel") {
        dispatch(
          addUser({ ...data?.payload, phone: data?.payload?.phoneNumber })
        );
        router.push("/");
      } else {
        dispatch(addUser({ ...data?.payload, phone: phoneNumber }));
      }
    });
  } else {
    console.log("Failed to decode data.");
  }

  if (!isValidTable) {
    return <TableOccupiedMessage />;
  }
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
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
      startCountdown(); // Start countdown here

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast.error("Something went wrong");
      console.error("Error in handleRegisterSubmit:", error);
    }
  };

  const handleOtpSubmit = async () => {
    setIsLoading(true); // Add loading state
    console.log("handleOtpSubmit called with values:", otp);

    try {
      console.log("Verifying phone OTP...");
      const phoneVerified = await verifyOtp(verificationId, otp);
      console.log("phoneVerified:", phoneVerified);

      if (!phoneVerified) {
        toast.error("Invalid phone OTP");
        console.log("Invalid phone OTP");
        setIsLoading(false);
        return;
      }

      // Set state and show toast before navigation
      toast.success("Verification successful!");
      console.log("User verification successful!");

      // Use replace to prevent back navigation to login
      router.replace("/");
    } catch (error) {
      toast.error("Verification failed");
      console.error("Error in handleOtpSubmit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      console.log("Resending OTPs...");
      const phoneOtpRes: any = await resendOtp(fNumber);
      console.log("phoneOtpRes:", phoneOtpRes);

      if (phoneOtpRes) {
        setVerificationId(phoneOtpRes.verificationId);
        startCountdown(); // Restart countdown
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
                      autoFocus
                    />
                    <Button type="submit">
                      {isLoading && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send OTP
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="text-sm text-gray-500">
                    {count > 0
                      ? `Resend OTP in ${count}s`
                      : "You can resend OTP now"}
                  </div>
                  <Button
                    onClick={() => handleOtpSubmit()}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify OTP
                  </Button>
                </div>
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
// http://localhost:3001/login?token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InZpa3VtYXIuYXphZEBnbWFpbC5jb20iLCJ0YWJsZU5vIjoiNiIsInRheCI6eyJnc3RQZXJjZW50YWdlIjoiIn19.Eq-sf6OZdlLUAmZHM3rP0Zxc5J6dFd7KaB3CzKFh8cA&__vercel_draft=1
// http://localhost:3001/login?token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InZpa3VtYXIuYXphZEBnbWFpbC5jb20iLCJ0YWJsZU5vIjoiOCIsInRheCI6eyJnc3RQZXJjZW50YWdlIjoiIn19.DTiaFgsCRkNAV0ln4-ut322jwZM21wMhUE-YK2faCEk
