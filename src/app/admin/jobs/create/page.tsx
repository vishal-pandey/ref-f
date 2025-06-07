"use client";

import JobForm from "@/components/admin/JobForm";
import { createJobAction } from "@/lib/actions";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function CreateJobPage() {
  const { token, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <div>
      <JobForm onSubmitAction={createJobAction} authToken={token} />
    </div>
  );
}
