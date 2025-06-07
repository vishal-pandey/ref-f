"use client";

import React, { useState, useEffect, Suspense } from "react";
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit: SubmitHandler<OtpFormValues> = async (data) => {
    if (!identifier) return;
    setIsVerifying(true);

    const requestData: OTPVerify = { otp_code: data.otp_code };
    if (identifier.includes("@")) {
      requestData.email = identifier;
    } else {
      requestData.mobile_number = identifier;
    }

    try {
      const tokenData: Token = await verifyOtpAction(requestData);
      login(tokenData); // This now sets the token in AuthContext and updates user
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
      setCountdown(60); // Start 60s countdown
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
              <Label htmlFor="otp_code" className="text-base">
                Enter OTP
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="otp_code"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  {...register("otp_code")}
                  className={`pl-10 text-base tracking-[0.3em] text-center ${errors.otp_code ? "border-destructive" : ""}`}
                  autoComplete="one-time-code"
                />
              </div>
              {errors.otp_code && (
                <p className="text-sm text-destructive">{errors.otp_code.message}</p>
              )}
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
