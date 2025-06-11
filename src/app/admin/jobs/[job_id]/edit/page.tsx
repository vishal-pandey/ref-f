
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import JobForm from "@/components/admin/JobForm";
import { getJobByIdAction, updateJobAction, deleteJobAction } from "@/lib/actions";
import type { JobPostInDB } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function EditJobContent() {
  const params = useParams();
  const jobId = typeof params.job_id === 'string' ? params.job_id : '';
  
  const [job, setJob] = useState<JobPostInDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!jobId || authLoading) return; // Don't fetch if no ID or auth is still loading

    if (!token) {
      setError("Not authenticated to edit job details."); // Should be caught by AdminAuthGuard, but good to double check
      setIsLoading(false);
      return;
    }

    const fetchJob = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedJob = await getJobByIdAction(jobId, token); // Pass token here
        setJob(fetchedJob);
      } catch (err: any) {
        setError(err.message || "Failed to fetch job details for editing.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId, token, authLoading]);

  if (isLoading || authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto my-8 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Job
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card className="max-w-2xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Job Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The job you are trying to edit could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (data: any, authToken: string) => {
    return updateJobAction(jobId, data, authToken);
  };

  const handleDelete = (id: string, authToken: string) => {
    return deleteJobAction(id, authToken);
  };

  return (
    <JobForm 
      job={job} 
      onSubmitAction={handleSubmit} 
      onDeleteAction={handleDelete}
      authToken={token} 
    />
  );
}


export default function EditJobPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <EditJobContent />
    </Suspense>
  );
}
