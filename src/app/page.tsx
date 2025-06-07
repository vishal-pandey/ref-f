"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import JobCard from '@/components/jobs/JobCard';
import JobSearchForm from '@/components/jobs/JobSearchForm';
import SimilarJobs from '@/components/jobs/SimilarJobs';
import { getJobsAction } from '@/lib/actions';
import type { JobPostInDB, JobFilters } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';


const JOBS_PER_PAGE = 9;

function JobsPageContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobPostInDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0); // Assuming API might provide total or infer from results

  const [filters, setFilters] = useState<JobFilters>({});

  useEffect(() => {
    const roleName = searchParams.get('RoleName') || undefined;
    const companyName = searchParams.get('CompanyName') || undefined;
    const location = searchParams.get('Location') || undefined;
    const departmentName = searchParams.get('DepartmentName') || undefined;

    setFilters({ RoleName: roleName, CompanyName: companyName, Location: location, DepartmentName: departmentName });
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchParams]);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: JobFilters = {
          ...filters,
          skip: (currentPage - 1) * JOBS_PER_PAGE,
          limit: JOBS_PER_PAGE,
        };
        const fetchedJobs = await getJobsAction(params);
        setJobs(fetchedJobs);
        // This is a simplification for totalJobs. A real API would provide a total count.
        // If fetchedJobs length is less than JOBS_PER_PAGE, it might be the last page.
        if (fetchedJobs.length < JOBS_PER_PAGE) {
            setTotalJobs((currentPage -1) * JOBS_PER_PAGE + fetchedJobs.length);
        } else {
            // If we got a full page, there might be more. We'd need a total count from API.
            // For now, just assume there's at least one more page possible if full.
            setTotalJobs(currentPage * JOBS_PER_PAGE + 1); 
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch jobs.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [filters, currentPage]);

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  const currentSearchTerm = filters.RoleName || filters.CompanyName || "";

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

      {currentSearchTerm && <SimilarJobs userInput={currentSearchTerm} />}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: JOBS_PER_PAGE }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-muted rounded w-full"></div>
              </CardFooter>
            </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                // Display only a limited number of page buttons for brevity
                .filter(pageNumber => 
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= currentPage -1 && pageNumber <= currentPage + 1)
                )
                .map((pageNumber, index, arr) => (
                  <React.Fragment key={pageNumber}>
                    {index > 0 && arr[index-1] !== pageNumber -1 && pageNumber !== currentPage -1 && pageNumber !== currentPage && pageNumber !== currentPage+1 && <span className="text-muted-foreground">...</span> }
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  </React.Fragment>
                ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <JobsPageContent />
    </Suspense>
  );
}

