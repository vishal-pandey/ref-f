"use client";

import { recommendTrainingResources } from "@/ai/flows/recommend-training-resources";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

interface TrainingResourcesProps {
  jobDescription: string;
}

export default function TrainingResources({ jobDescription }: TrainingResourcesProps) {
  const [resources, setResources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobDescription) {
      setIsLoading(false);
      return;
    }

    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await recommendTrainingResources({ jobDescription });
        setResources(result.trainingResources);
      } catch (err) {
        console.error("Error fetching training resources:", err);
        setError("Failed to load training recommendations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [jobDescription]);

  if (isLoading) {
    return (
      <Card className="mt-8 animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <Lightbulb className="h-6 w-6 mr-2 text-yellow-400" />
            AI Recommended Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
     return (
       <Card className="mt-8 border-destructive">
        <CardHeader>
           <CardTitle className="flex items-center text-xl font-semibold text-destructive">
            <Lightbulb className="h-6 w-6 mr-2" />
            Error Fetching Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (resources.length === 0) {
    return null; // Don't render if no resources
  }

  return (
    <Card className="mt-8 shadow-lg bg-gradient-to-br from-accent/10 via-background to-background">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-accent">
          <Lightbulb className="h-6 w-6 mr-3 text-yellow-400" />
          AI Recommended Training Resources
        </CardTitle>
        <CardDescription>
          Explore these resources to prepare for this role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {resources.map((resource, index) => (
            <li key={index} className="flex items-start p-3 bg-card rounded-md border hover:shadow-sm transition-shadow">
              <BookOpen className="h-5 w-5 mr-3 mt-1 text-accent shrink-0" />
              <div className="flex-grow">
                <p className="text-foreground">{resource}</p>
                {/* Attempt to make it a link if it looks like one */}
                {resource.startsWith('http') && (
                  <Button variant="link" asChild className="p-0 h-auto mt-1 text-sm">
                    <Link href={resource} target="_blank" rel="noopener noreferrer">
                      Visit Resource <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
