
"use client";

import type { JobPostInDB } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Briefcase, CalendarDays, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface JobListItemProps {
  job: JobPostInDB;
}

export default function JobListItem({ job }: JobListItemProps) {
  const postingDate = job.PostingDate ? new Date(job.PostingDate) : null;
  const timeAgo = postingDate ? formatDistanceToNow(postingDate, { addSuffix: true }) : 'N/A';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
      <div className="flex-grow mb-4 sm:mb-0 sm:mr-4">
        <Link href={`/jobs/${job.id}`} className="group">
          <h3 className="text-xl font-semibold text-primary group-hover:underline">{job.RoleName}</h3>
        </Link>
        <div className="text-sm text-muted-foreground flex items-center mt-1">
          <Building className="h-4 w-4 mr-1.5 shrink-0" /> {job.CompanyName}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span>{job.Location || "Not specified"}</span>
          </div>
          {job.DepartmentName && (
            <div className="flex items-center">
              <Briefcase className="h-3 w-3 mr-1 shrink-0" />
              <span>{job.DepartmentName}</span>
            </div>
          )}
          <div className="flex items-center">
            <CalendarDays className="h-3 w-3 mr-1 shrink-0" />
            <span>Posted {timeAgo}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start sm:items-end sm:space-y-2 flex-shrink-0">
        {job.ReferralStatus && (
          <Badge
            variant={job.ReferralStatus.toLowerCase() === 'yes' ? 'default' : 'secondary'}
            className="text-xs capitalize"
          >
            {job.ReferralStatus.toLowerCase() === 'yes' ?
              <CheckCircle className="h-3 w-3 mr-1" /> :
            (job.ReferralStatus.toLowerCase() === 'no' ?
              <XCircle className="h-3 w-3 mr-1" /> : null)
            }
            Referral: {job.ReferralStatus}
          </Badge>
        )}
        <Button asChild size="sm" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/jobs/${job.id}`}>
            View Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
