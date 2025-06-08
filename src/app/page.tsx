
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import JobListItem from '@/components/jobs/JobListItem'; // Changed from JobCard
import JobSearchForm from '@/components/jobs/JobSearchForm';

import { getJobsAction } from '@/lib/actions';
import type { JobPostInDB, JobFilters } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const JOBS_PER_PAGE = 10; // Can show more items in list view

function JobsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading: authLoading, isProfileComplete } = useAuth();

  const [jobs, setJobs] = useState<JobPostInDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const [filters, setFilters] = useState<JobFilters>({});

  useEffect(() => {
    if (authLoading) return; 

    const currentQuery = searchParams.toString();
    const redirectPath = pathname + (currentQuery ? `?${currentQuery}` : '');

    if (!user || !token) {
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    if (user && !isProfileComplete) {
      router.push(`/complete-profile?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    const roleName = searchParams.get('RoleName') || undefined;
    const companyName = searchParams.get('CompanyName') || undefined;
    const location = searchParams.get('Location') || undefined;
    const departmentName = searchParams.get('DepartmentName') || undefined;

    setFilters({ RoleName: roleName, CompanyName: companyName, Location: location, DepartmentName: departmentName });
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchParams, user, token, authLoading, router, pathname, isProfileComplete]);

  useEffect(() => {
    if (!token || authLoading || (user && !isProfileComplete)) return; 

    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: JobFilters = {
          ...filters,
          skip: (currentPage - 1) * JOBS_PER_PAGE,
          limit: JOBS_PER_PAGE,
        };
        const fetchedJobs = await getJobsAction(params, token);
        setJobs(fetchedJobs);
        
        if (fetchedJobs.length < JOBS_PER_PAGE) {
            setTotalJobs((currentPage -1) * JOBS_PER_PAGE + fetchedJobs.length);
        } else {
            const nextPageCheckParams = { ...filters, skip: currentPage * JOBS_PER_PAGE, limit: 1 };
            const nextPageCheckJobs = await getJobsAction(nextPageCheckParams, token);
            if (nextPageCheckJobs.length === 0) { 
                setTotalJobs(currentPage * JOBS_PER_PAGE);
            } else { 
                 setTotalJobs(currentPage * JOBS_PER_PAGE + 1); 
            }
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch jobs.');
        if (err.message === "Authentication token is required for this action." || err.status === 401 || err.status === 403) {
             const currentQuery = searchParams.toString();
             const redirectPath = pathname + (currentQuery ? `?${currentQuery}` : '');
             router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [filters, currentPage, token, authLoading, user, isProfileComplete, router, pathname, searchParams]);

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (newPage <= totalPages || totalJobs > (currentPage * JOBS_PER_PAGE) ) ) { // Allow going to next page if more jobs might exist
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  if (authLoading || (!authLoading && (!user || !token)) || (!authLoading && user && !isProfileComplete)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">
          {authLoading ? "Authenticating..." : (user && !isProfileComplete) ? "Checking profile..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="text-center px-0">
          <CardTitle className="text-4xl md:text-5xl font-headline tracking-tight">Find Your Next Opportunity</CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse through the latest job openings or use the filters to narrow down your search.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <JobSearchForm />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: JOBS_PER_PAGE }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
                <div className="h-8 w-24 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-xl font-semibold text-destructive">Error loading jobs</p>
          <p className="text-destructive/80">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-10 bg-card border rounded-lg">
          <ListFilter className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-xl font-semibold">No jobs found</p>
          <p className="text-muted-foreground">Try adjusting your search filters or check back later.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4"> {/* Changed from grid to space-y for list view */}
            {jobs.map((job) => (
              <JobListItem key={job.id} job={job} /> // Changed from JobCard
            ))}
          </div>
          {totalPages > 0 && jobs.length > 0 && ( // only show pagination if there are jobs and more than one potential page
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pageNumber => 
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= currentPage -1 && pageNumber <= currentPage + 1) ||
                    (totalPages <= 5) 
                )
                .map((pageNumber, index, arr) => (
                  <React.Fragment key={pageNumber}>
                    {index > 0 && arr[index-1] !== pageNumber -1 && pageNumber !== currentPage -1 && pageNumber !== currentPage && pageNumber !== currentPage+1 && totalPages > 5 && <span className="text-muted-foreground px-1">...</span> }
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNumber)}
                      aria-current={currentPage === pageNumber ? "page" : undefined}
                      className="w-9 h-9"
                    >
                      {pageNumber}
                    </Button>
                  </React.Fragment>
                ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalJobs <= currentPage * JOBS_PER_PAGE}
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">Loading...</p></div>}>
      <JobsPageContent />
    </Suspense>
  );
}
