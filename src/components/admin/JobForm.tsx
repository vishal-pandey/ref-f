"use client";

import React, { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { JobPostCreate, JobPostUpdate, JobPostInDB } from "@/lib/types";
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const jobFormSchema = z.object({
  RoleName: z.string().min(1, "Role name is required"),
  CompanyName: z.string().min(1, "Company name is required"),
  JobDescription: z.string().min(1, "Job description is required"),
  DepartmentName: z.string().optional().nullable(),
  Location: z.string().optional().nullable(),
  ContactEmail: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  ApplicationLink: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  ReferralStatus: z.string().optional().nullable(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  job?: JobPostInDB | null; // For editing
  onSubmitAction: (data: JobPostCreate | JobPostUpdate, token: string) => Promise<any>;
  onDeleteAction?: (jobId: string, token: string) => Promise<void>;
  authToken: string | null;
}

export default function JobForm({ job, onSubmitAction, onDeleteAction, authToken }: JobFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      RoleName: job?.RoleName || "",
      CompanyName: job?.CompanyName || "",
      JobDescription: job?.JobDescription || "",
      DepartmentName: job?.DepartmentName || "",
      Location: job?.Location || "",
      ContactEmail: job?.ContactEmail || "",
      ApplicationLink: job?.ApplicationLink || "",
      ReferralStatus: job?.ReferralStatus || "no",
    },
  });
  
  useEffect(() => {
    if (job) {
      reset({
        RoleName: job.RoleName || "",
        CompanyName: job.CompanyName || "",
        JobDescription: job.JobDescription || "",
        DepartmentName: job.DepartmentName || "",
        Location: job.Location || "",
        ContactEmail: job.ContactEmail || "",
        ApplicationLink: job.ApplicationLink || "",
        ReferralStatus: job.ReferralStatus || "no",
      });
    }
  }, [job, reset]);


  const onSubmit: SubmitHandler<JobFormValues> = async (data) => {
    if (!authToken) {
      toast({ title: "Authentication Error", description: "You are not authorized.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        // Ensure empty strings are converted to nulls if API expects that for optional fields
        ContactEmail: data.ContactEmail === "" ? null : data.ContactEmail,
        ApplicationLink: data.ApplicationLink === "" ? null : data.ApplicationLink,
      };
      await onSubmitAction(payload, authToken);
      toast({
        title: job ? "Job Updated" : "Job Created",
        description: `Job "${data.RoleName}" has been successfully ${job ? 'updated' : 'created'}.`,
      });
      router.push("/admin"); // Redirect to admin dashboard
      router.refresh(); // Refresh server components
    } catch (error: any) {
      toast({
        title: job ? "Update Failed" : "Creation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !job.id || !onDeleteAction || !authToken) return;
    setIsDeleting(true);
    try {
      await onDeleteAction(job.id, authToken);
      toast({
        title: "Job Deleted",
        description: `Job "${job.RoleName}" has been successfully deleted.`,
      });
      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <CardTitle className="text-3xl font-headline">{job ? "Edit Job Posting" : "Create New Job Posting"}</CardTitle>
        <CardDescription>
          {job ? "Update the details of the job posting." : "Fill in the details to post a new job."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* RoleName, CompanyName, JobDescription are required */}
          <div>
            <Label htmlFor="RoleName">Role Name <span className="text-destructive">*</span></Label>
            <Input id="RoleName" {...register("RoleName")} className={errors.RoleName ? "border-destructive" : ""} />
            {errors.RoleName && <p className="text-sm text-destructive">{errors.RoleName.message}</p>}
          </div>
          <div>
            <Label htmlFor="CompanyName">Company Name <span className="text-destructive">*</span></Label>
            <Input id="CompanyName" {...register("CompanyName")} className={errors.CompanyName ? "border-destructive" : ""} />
            {errors.CompanyName && <p className="text-sm text-destructive">{errors.CompanyName.message}</p>}
          </div>
           <div>
            <Label htmlFor="Location">Location</Label>
            <Input id="Location" {...register("Location")} />
            {errors.Location && <p className="text-sm text-destructive">{errors.Location.message}</p>}
          </div>
          <div>
            <Label htmlFor="DepartmentName">Department Name</Label>
            <Input id="DepartmentName" {...register("DepartmentName")} />
            {errors.DepartmentName && <p className="text-sm text-destructive">{errors.DepartmentName.message}</p>}
          </div>
          <div>
            <Label htmlFor="ContactEmail">Contact Email</Label>
            <Input id="ContactEmail" type="email" {...register("ContactEmail")} />
            {errors.ContactEmail && <p className="text-sm text-destructive">{errors.ContactEmail.message}</p>}
          </div>
          <div>
            <Label htmlFor="ApplicationLink">Application Link</Label>
            <Input id="ApplicationLink" type="url" {...register("ApplicationLink")} />
            {errors.ApplicationLink && <p className="text-sm text-destructive">{errors.ApplicationLink.message}</p>}
          </div>
           <div>
            <Label htmlFor="ReferralStatus">Referral Available Status</Label>
            <Controller
                name="ReferralStatus"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value || "no"}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select referral status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="maybe">Maybe</SelectItem>
                        <SelectItem value="ask">Ask for referral</SelectItem>
                    </SelectContent>
                    </Select>
                )}
            />
            {errors.ReferralStatus && <p className="text-sm text-destructive">{errors.ReferralStatus.message}</p>}
          </div>
          <div>
            <Label htmlFor="JobDescription">Job Description <span className="text-destructive">*</span></Label>
            <Textarea id="JobDescription" {...register("JobDescription")} rows={8} className={errors.JobDescription ? "border-destructive" : ""} />
            {errors.JobDescription && <p className="text-sm text-destructive">{errors.JobDescription.message}</p>}
          </div>
          <CardFooter className="flex justify-between p-0 pt-6">
            <Button type="submit" disabled={isSubmitting || !authToken} className="min-w-[120px]">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {job ? "Save Changes" : "Create Job"}
            </Button>
            {job && onDeleteAction && (
               <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button" disabled={isDeleting || !authToken} className="min-w-[120px]">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Job
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the job posting for "{job.RoleName}" at "{job.CompanyName}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Yes, delete it
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
