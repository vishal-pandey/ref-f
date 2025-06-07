"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { requestOtpAction } from "@/lib/actions";
import type { OTPRequest } from "@/lib/types";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Mobile number is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "mobile">("email");
  
  const { user, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
    if (!authIsLoading && user) {
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    }
  }, [user, authIsLoading, router, searchParams]);


  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const identifierValue = watch("identifier");

  useEffect(() => {
    // Basic check to infer login method - can be more sophisticated
    if (identifierValue && identifierValue.includes("@")) {
      setLoginMethod("email");
    } else if (identifierValue && /^\+?[0-9\s-()]+$/.test(identifierValue)) {
      setLoginMethod("mobile");
    }
  }, [identifierValue]);


  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    const requestData: OTPRequest = {};
    if (loginMethod === "email") {
      if (!z.string().email().safeParse(data.identifier).success) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      requestData.email = data.identifier;
    } else {
      // Basic mobile validation, can be improved with a library like libphonenumber-js
      const numericMobile = data.identifier.replace(/\D/g, '');
      if (numericMobile.length < 10) { // Simple length check
         toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid mobile number.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      requestData.mobile_number = data.identifier.startsWith('+') ? data.identifier : `+${data.identifier}`; // Assuming international format or prefixing
    }

    try {
      await requestOtpAction(requestData);
      toast({
        title: "OTP Sent",
        description: `An OTP has been sent to ${data.identifier}.`,
      });
      const redirectParam = searchParams.get("redirect");
      const verifyOtpPath = `/verify-otp?identifier=${encodeURIComponent(data.identifier)}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}`: ''}`;
      router.push(verifyOtpPath);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authIsLoading || (!authIsLoading && user)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Welcome to JobConnect</CardTitle>
          <CardDescription className="text-center">
            Enter your email or mobile number to receive an OTP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-base">
                Email or Mobile Number
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginMethod === 'email' ? <Mail className="h-5 w-5 text-muted-foreground" /> : <Smartphone className="h-5 w-5 text-muted-foreground" />}
                </div>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={loginMethod === 'email' ? "name@example.com" : "+1234567890"}
                  {...register("identifier")}
                  className={`pl-10 text-base ${errors.identifier ? "border-destructive" : ""}`}
                  autoComplete="username"
                />
              </div>
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
