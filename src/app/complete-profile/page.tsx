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
import { updateUserAction } from "@/lib/actions";
import type { UserUpdate } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Loader2, UserSquare, Phone } from "lucide-react";

export const dynamic = 'force-dynamic';

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100, "Full name is too long"),
  mobile_number: z.string().min(1, "Mobile number is required")
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid mobile number format (e.g., +1234567890, 8-15 digits)"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, token, isLoading: authContextLoading, updateCurrentUser, isProfileComplete } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!authContextLoading) {
      if (!user || !token) {
        router.push("/login");
      } else if (isProfileComplete) {
        const redirect = searchParams.get("redirect") || "/";
        router.push(redirect);
      } else {
        if (user.full_name) setValue("full_name", user.full_name);
        if (user.mobile_number) setValue("mobile_number", user.mobile_number);
      }
    }
  }, [user, token, authContextLoading, isProfileComplete, router, searchParams, setValue]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!token) {
      toast({ title: "Error", description: "Authentication token not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedUser = await updateUserAction(data, token);
      updateCurrentUser(updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authContextLoading || (!authContextLoading && (!user || !token))) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!authContextLoading && user && isProfileComplete) {
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-2">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Please provide your full name and mobile number to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  {...register("full_name")}
                  className={`pl-10 ${errors.full_name ? "border-destructive" : ""}`}
                  autoComplete="name"
                />
              </div>
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="mobile_number"
                  type="tel"
                  placeholder="+1234567890"
                  {...register("mobile_number")}
                  className={`pl-10 ${errors.mobile_number ? "border-destructive" : ""}`}
                  autoComplete="tel"
                />
              </div>
              {errors.mobile_number && <p className="text-sm text-destructive">{errors.mobile_number.message}</p>}
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save and Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}
