
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { Loader2 } from "lucide-react";

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

  const identifier = searchParams.get("identifier"); // This will now always be an email
  const redirectUrl = searchParams.get("redirect") || "/";

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    mode: "onSubmit", 
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
        description: "Identifier (email) not found. Please try logging in again.",
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

  useEffect(() => {
    const combinedOtp = otpDigits.join("");
    setValue("otp_code", combinedOtp);
  }, [otpDigits, setValue]);

  useEffect(() => {
    const combinedOtp = otpDigits.join("");
    if (combinedOtp.length === 6 && !isVerifying) {
      trigger("otp_code").then(isValid => {
        if (isValid) {
          handleSubmit(onSubmit)();
        }
      });
    }
  }, [otpDigits, handleSubmit, trigger]);


  const handleOtpDigitChange = (index: number, value: string) => {
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.slice(-1).replace(/\D/g, ""); 
    setOtpDigits(newOtpDigits);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault(); 
      const newOtpDigits = [...otpDigits];
      if (newOtpDigits[index]) {
        newOtpDigits[index] = ""; 
        setOtpDigits(newOtpDigits);
      } else if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, ""); 
    if (pastedData.length === 6) {
      const newOtpDigits = pastedData.split("");
      setOtpDigits(newOtpDigits);
      setValue("otp_code", pastedData); 
      if (inputRefs.current[5]) {
        inputRefs.current[5]?.focus(); 
      }
    } else if (pastedData.length > 0 && pastedData.length < 6) {
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
    if (!identifier || isVerifying) {
      return;
    }
    
    const isValid = await trigger("otp_code");
    if (!isValid) {
        return;
    }

    setIsVerifying(true);

    const requestData: OTPVerify = { 
      otp_code: data.otp_code,
      email: identifier // Identifier is now always email
    };
    
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
      setOtpDigits(Array(6).fill("")); 
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus(); 
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!identifier) return;
    setIsResending(true);
    const requestData: OTPRequest = { email: identifier }; // Identifier is now always email

    try {
      await requestOtpAction(requestData);
      toast({
        title: "OTP Resent",
        description: `A new OTP has been sent to ${identifier}.`,
      });
      setOtpDigits(Array(6).fill("")); 
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus(); 
      }
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
            <p className="text-center text-destructive">Missing email identifier. Please return to login.</p>
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
            {isVerifying && <span className="block mt-2"><Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />Verifying...</span>}
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
                    type="text" 
                    maxLength={1}
                    pattern="[0-9]" 
                    inputMode="numeric" 
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-10 h-12 text-center text-xl border-2 ${errors.otp_code && !isVerifying ? "border-destructive" : "border-input"} focus:border-primary focus:ring-primary transition-all duration-150 ease-in-out`}
                    autoComplete="one-time-code"
                    aria-label={`OTP digit ${index + 1}`}
                    disabled={isVerifying}
                  />
                ))}
              </div>
              <input type="hidden" {...setValue("otp_code", otpDigits.join(""))} />
              {errors.otp_code && !isVerifying && <p className="text-sm text-destructive text-center pt-2">{errors.otp_code.message}</p>}
            </div>
          </form>
          <div className="mt-6 text-center text-sm"> 
            Didn't receive OTP?{" "}
            <Button
              variant="link"
              onClick={handleResendOtp}
              disabled={isResending || countdown > 0 || isVerifying}
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
