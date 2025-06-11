
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import type { JobPostInDB } from "@/lib/types";
import { getJobByIdAction } from "@/lib/actions";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, Building, CalendarDays, CheckCircle, ExternalLink, Loader2, Mail, MapPin, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from 'date-fns';

function JobDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const jobId = typeof params.job_id === 'string' ? params.job_id : '';
  const { user, token, isLoading: authLoading, isProfileComplete } = useAuth();

  const [job, setJob] = useState<JobPostInDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const redirectPath = pathname; 

    if (!user || !token) {
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    if (user && !isProfileComplete) {
      router.push(`/complete-profile?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }
    
    if (!jobId) {
      setError("Job ID is missing.");
      setIsLoading(false);
      return;
    }
    
    const fetchJobDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedJob = await getJobByIdAction(jobId, token); 
        setJob(fetchedJob);
      } catch (err: any) {
        setError(err.message || "Failed to fetch job details.");
        if (err.message === "Authentication token is required for this action." || err.status === 401 || err.status === 403) {
             router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, token, user, authLoading, router, pathname, isProfileComplete]);

  if (authLoading || (!authLoading && (!user || !token)) || (!authLoading && user && !isProfileComplete)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <p className="ml-4 text-muted-foreground">
            {authLoading ? "Authenticating..." : (user && !isProfileComplete) ? "Checking profile..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg max-w-2xl mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 text-xl font-semibold text-destructive">Error loading job details</p>
        <p className="text-destructive/80">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!job) {
    if (isLoading) { 
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading job details...</p>
            </div>
        );
    }
    return (
      <div className="text-center py-10 max-w-2xl mx-auto">
        <p className="text-xl">Job not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const postingDate = job.PostingDate ? new Date(job.PostingDate) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-card p-6 border-b">
          <CardTitle className="text-3xl font-headline text-primary">{job.RoleName}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            <span className="flex items-center"> {/* Changed to span for cases where ApplicationLink is missing */}
              <Building className="h-5 w-5 mr-2 shrink-0" /> {job.CompanyName}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 mr-3 mt-1 text-primary shrink-0" />
              <div>
                <span className="font-semibold">Location:</span> {job.Location || "Not specified"}
              </div>
            </div>
            {job.DepartmentName && (
              <div className="flex items-start">
                <Briefcase className="h-5 w-5 mr-3 mt-1 text-primary shrink-0" />
                <div>
                  <span className="font-semibold">Department:</span> {job.DepartmentName}
                </div>
              </div>
            )}
            <div className="flex items-start">
              <CalendarDays className="h-5 w-5 mr-3 mt-1 text-primary shrink-0" />
              <div>
                <span className="font-semibold">Posted:</span> {postingDate ? format(postingDate, 'PPP') : 'N/A'}
              </div>
            </div>
            {job.ContactEmail && (
               <div className="flex items-start">
                <Mail className="h-5 w-5 mr-3 mt-1 text-primary shrink-0" />
                <div>
                  <span className="font-semibold">Contact:</span> <a href={`mailto:${job.ContactEmail}`} className="text-primary hover:underline">{job.ContactEmail}</a>
                </div>
              </div>
            )}
            {job.ReferralStatus && (
              <div className="flex items-center">
                {job.ReferralStatus.toLowerCase() === 'yes' ? 
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0" /> : 
                  <XCircle className="h-5 w-5 mr-2 text-red-500 shrink-0" />}
                <span className="font-semibold mr-1">Referral:</span>
                <Badge variant={job.ReferralStatus.toLowerCase() === 'yes' ? 'default' : 'secondary'} className="capitalize">
                  {job.ReferralStatus}
                </Badge>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 font-headline">Job Description</h3>
            <article className="prose prose-sm max-w-none text-foreground dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.JobDescription}</ReactMarkdown>
            </article>
          </div>
          
          {(job.ApplicationLink || job.ContactEmail) && (
            <div className="pt-4 border-t">
              <Button asChild size="lg" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                {job.ApplicationLink ? (
                  <Link href={job.ApplicationLink} target="_blank" rel="noopener noreferrer">
                    Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                ) : job.ContactEmail ? (
                  <Link href={`mailto:${job.ContactEmail}`}>
                    Apply Now <Mail className="ml-2 h-4 w-4" />
                  </Link>
                ) : null}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">Loading...</p></div>}>
      <JobDetailsContent />
    </Suspense>
  );
}
