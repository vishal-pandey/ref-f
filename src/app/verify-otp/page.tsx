
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { verifyOtpAction, requestOtpAction } from "@/lib/actions";
import type { OTPVerify, Token, OTPRequest } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldCheck } from "lucide-react";

const otpSchema = z.object({
  otp_code: z.string().length(6, "OTP must be 6 digits"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login, user, isLoading: authIsLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const identifier = searchParams.get("identifier");
  const redirectUrl = searchParams.get("redirect") || "/";

  // State for individual OTP digits
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    handleSubmit,
    setValue, // For react-hook-form
    formState: { errors },
    trigger, // To manually trigger validation
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    mode: "onChange", // Validate on change to show errors as user types if needed
  });

  useEffect(() => {
    if (!authIsLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authIsLoading, router, redirectUrl]);

  useEffect(() => {
    if (!identifier) {
      toast({
        title: "Error",
        description: "Identifier (email/mobile) not found. Please try logging in again.",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [identifier, router, toast]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Effect to update react-hook-form's otp_code value when otpDigits change
  useEffect(() => {
    const combinedOtp = otpDigits.join("");
    setValue("otp_code", combinedOtp, { shouldValidate: true });
  }, [otpDigits, setValue]);


  const handleOtpDigitChange = (index: number, value: string) => {
    const newOtpDigits = [...otpDigits];
    // Allow only single digit
    newOtpDigits[index] = value.slice(-1); 
    setOtpDigits(newOtpDigits);

    // Auto-focus next input if digit entered and not the last input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault(); // Prevent default backspace behavior
      const newOtpDigits = [...otpDigits];
      if (newOtpDigits[index]) {
        newOtpDigits[index] = ""; // Clear current input
        setOtpDigits(newOtpDigits);
      } else if (index > 0 && inputRefs.current[index - 1]) {
         // If current is empty and not the first input, focus previous
        inputRefs.current[index - 1]?.focus();
        // Optionally clear previous input as well
        // const prevOtpDigits = [...otpDigits];
        // prevOtpDigits[index-1] = "";
        // setOtpDigits(prevOtpDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, ""); // Remove non-digits
    if (pastedData.length === 6) {
      const newOtpDigits = pastedData.split("");
      setOtpDigits(newOtpDigits);
      setValue("otp_code", pastedData, { shouldValidate: true }); // Update RHF value
      if (inputRefs.current[5]) {
        inputRefs.current[5]?.focus(); // Focus last input after paste
      }
    } else if (pastedData.length > 0 && pastedData.length < 6) {
        // Partial paste, fill from current input
        const currentFocusIndex = inputRefs.current.findIndex(ref => ref === document.activeElement);
        const startIndex = currentFocusIndex !== -1 ? currentFocusIndex : 0;
        const newOtpDigits = [...otpDigits];
        for (let i = 0; i < pastedData.length && (startIndex + i) < 6; i++) {
            newOtpDigits[startIndex + i] = pastedData[i];
        }
        setOtpDigits(newOtpDigits);
        const lastFilledIndex = Math.min(startIndex + pastedData.length -1, 5);
         if (inputRefs.current[lastFilledIndex]) {
            inputRefs.current[lastFilledIndex]?.focus();
        }
    }
  };


  const onSubmit: SubmitHandler<OtpFormValues> = async (data) => {
    if (!identifier) return;
    // Ensure validation is triggered before submit, although react-hook-form should do this
    const isValid = await trigger("otp_code");
    if (!isValid) {
      toast({
        title: "Invalid OTP",
        description: "OTP must be 6 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    const requestData: OTPVerify = { otp_code: data.otp_code };
    if (identifier.includes("@")) {
      requestData.email = identifier;
    } else {
      requestData.mobile_number = identifier;
    }

    try {
      const tokenData: Token = await verifyOtpAction(requestData);
      login(tokenData); 
      toast({
        title: "Login Successful",
        description: "You have been successfully logged in.",
      });
      router.push(redirectUrl);
    } catch (error: any) {
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Invalid OTP or an unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!identifier) return;
    setIsResending(true);
    const requestData: OTPRequest = {};
    if (identifier.includes("@")) {
      requestData.email = identifier;
    } else {
      requestData.mobile_number = identifier;
    }
    try {
      await requestOtpAction(requestData);
      toast({
        title: "OTP Resent",
        description: `A new OTP has been sent to ${identifier}.`,
      });
      setCountdown(60); 
    } catch (error: any) {
      toast({
        title: "Failed to Resend OTP",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };
  
  if (authIsLoading || (!authIsLoading && user)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }


  if (!identifier) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-destructive">Missing identifier. Please return to login.</p>
            <Button onClick={() => router.push('/login')} className="w-full mt-4">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Verify OTP</CardTitle>
          <CardDescription className="text-center">
            An OTP has been sent to <span className="font-medium text-foreground">{identifier}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp_code_0" className="text-base sr-only"> 
                Enter OTP
              </Label>
              <div className="flex justify-center space-x-2" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp_code_${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text" // Use text to allow single char, but pattern restricts
                    maxLength={1}
                    pattern="[0-9]" // Allow only digits
                    inputMode="numeric" // Show numeric keyboard on mobile
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-10 h-12 text-center text-xl border-2 ${errors.otp_code && otpDigits.join("").length !== 6 && !digit ? "border-destructive" : "border-input"} focus:border-primary focus:ring-primary transition-all duration-150 ease-in-out`}
                    autoComplete="one-time-code"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
              {/* This hidden input is managed by RHF for overall validation */}
              <input type="hidden" {...setValue("otp_code", otpDigits.join(""))} />
              {errors.otp_code && <p className="text-sm text-destructive text-center pt-2">{errors.otp_code.message}</p>}
            </div>
            
            <Button type="submit" className="w-full text-lg py-6" disabled={isVerifying}>
              {isVerifying ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Didn't receive OTP?{" "}
            <Button
              variant="link"
              onClick={handleResendOtp}
              disabled={isResending || countdown > 0}
              className="p-0 h-auto"
            >
              {isResending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Resend OTP {countdown > 0 ? `(${countdown}s)` : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
      
    