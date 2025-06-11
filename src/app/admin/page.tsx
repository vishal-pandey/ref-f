
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getJobsAction, deleteJobAction } from "@/lib/actions";
import type { JobPostInDB } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, ListChecks, ArrowRight } from "lucide-react";
import { format } from 'date-fns';
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

export default function AdminDashboardPage() {
  const [jobs, setJobs] = useState<JobPostInDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoading: authLoading } = useAuth(); // Added authLoading to avoid potential race conditions
  const { toast } = useToast();
  const router = useRouter();

  const fetchJobs = async () => {
    if (!token) {
      // This should ideally be caught by AdminAuthGuard, but good for safety
      setError("Authentication token not available to fetch jobs.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedJobs = await getJobsAction({ limit: 100 }, token); // Pass the token
      setJobs(fetchedJobs);
    } catch (err: any) {
      setError(err.message || "Failed to fetch jobs.");
      console.error("Error fetching jobs in admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth context to load and token to be available
    if (!authLoading && token) {
      fetchJobs();
    } else if (!authLoading && !token) {
      // If auth has loaded but no token, set an error or let AuthGuard handle it
      setIsLoading(false); 
      // setError("Not authenticated to view admin dashboard."); // Optional: specific error message
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]); // Depend on token and authLoading

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!token) {
        toast({ title: "Error", description: "Authentication token not found.", variant: "destructive"});
        return;
    }
    try {
      await deleteJobAction(jobId, token);
      toast({
        title: "Job Deleted",
        description: `Job "${jobTitle}" has been successfully deleted.`,
      });
      if (token) fetchJobs(); // Re-fetch jobs only if token is still valid
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Could not delete job.",
        variant: "destructive",
      });
    }
  };

  // Show loader if auth is loading or jobs are loading (if token is present)
  if (authLoading || (isLoading && token)) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">
                {authLoading ? "Authenticating..." : "Loading jobs..."}
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/jobs/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Job
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Manage Job Postings</CardTitle>
          <CardDescription>View, edit, or delete job postings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !authLoading ? ( // Show job-specific loader only if auth is done
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg">
                <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
                <p className="mt-3 text-lg font-semibold text-destructive">Error loading jobs</p>
                <p className="text-destructive/80">{error}</p>
            </div>
          ) : !token && !authLoading ? ( // If auth loaded and no token (should be handled by guard, but for completeness)
             <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg">
                <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
                <p className="mt-3 text-lg font-semibold text-destructive">Authentication Required</p>
                <p className="text-destructive/80">You need to be logged in to manage jobs.</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-xl font-semibold">No jobs posted yet.</p>
              <p className="text-muted-foreground">Start by creating a new job posting.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Posted Date</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.RoleName}</TableCell>
                      <TableCell>{job.CompanyName}</TableCell>
                      <TableCell>{job.Location || "N/A"}</TableCell>
                      <TableCell>{job.PostingDate ? format(new Date(job.PostingDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={job.ReferralStatus?.toLowerCase() === 'yes' ? 'default' : 'secondary'}>
                          {job.ReferralStatus || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild title="Edit Job">
                          <Link href={`/admin/jobs/${job.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" title="Delete Job">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the job posting for "{job.RoleName}" at "{job.CompanyName}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteJob(job.id, job.RoleName)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Yes, delete it
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                         <Button variant="ghost" size="sm" asChild title="View Job">
                          <Link href={`/jobs/${job.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {jobs.length > 0 && (
            <CardFooter className="justify-center border-t pt-4">
                 <p className="text-sm text-muted-foreground">Showing {jobs.length} job posting(s).</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
