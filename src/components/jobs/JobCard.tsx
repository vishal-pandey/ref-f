"use client";

import type { JobPostInDB } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Briefcase, CalendarDays, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: JobPostInDB;
}

export default function JobCard({ job }: JobCardProps) {
  const postingDate = job.PostingDate ? new Date(job.PostingDate) : null;
  const timeAgo = postingDate ? formatDistanceToNow(postingDate, { addSuffix: true }) : 'N/A';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">
          {job.RoleName}
        </CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground pt-1">
          <Building className="h-4 w-4 mr-2 shrink-0" /> {job.CompanyName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 mr-2 text-primary shrink-0" />
          <span>{job.Location || "Not specified"}</span>
        </div>
        {job.DepartmentName && (
          <div className="flex items-center text-sm">
            <Briefcase className="h-4 w-4 mr-2 text-primary shrink-0" />
            <span>{job.DepartmentName}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-2 shrink-0" />
          <span>Posted {timeAgo}</span>
        </div>
        {job.ReferralStatus && (
          <Badge variant={job.ReferralStatus.toLowerCase() === 'yes' ? 'default' : 'secondary'} className="mt-2">
            {job.ReferralStatus.toLowerCase() === 'yes' ? 
              <CheckCircle className="h-3 w-3 mr-1" /> : 
              <XCircle className="h-3 w-3 mr-1" />}
            Referral: {job.ReferralStatus}
          </Badge>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/jobs/${job.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
