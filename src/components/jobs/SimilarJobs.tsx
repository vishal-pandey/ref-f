"use client";

import { suggestSimilarJobs, SuggestSimilarJobsOutput } from "@/ai/flows/suggest-similar-jobs";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb } from "lucide-react";

interface SimilarJobsProps {
  userInput: string;
}

export default function SimilarJobs({ userInput }: SimilarJobsProps) {
  const [suggestions, setSuggestions] = useState<SuggestSimilarJobsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInput) {
      setIsLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await suggestSimilarJobs({ userInput });
        setSuggestions(result);
      } catch (err) {
        console.error("Error fetching similar job suggestions:", err);
        setError("Failed to load suggestions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [userInput]);

  if (isLoading) {
    return (
      <Card className="mt-6 animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
            AI Job Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3 mt-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="mt-6 border-destructive">
        <CardHeader>
           <CardTitle className="flex items-center text-lg font-semibold text-destructive">
            <Lightbulb className="h-5 w-5 mr-2" />
            Error Fetching Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!suggestions || (suggestions.jobTitleSuggestions.length === 0 && suggestions.companySuggestions.length === 0)) {
    return null; // Don't render if no suggestions or user input
  }


  return (
    <Card className="mt-6 shadow-md bg-gradient-to-br from-background to-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold text-primary">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
          AI Job Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.jobTitleSuggestions && suggestions.jobTitleSuggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-foreground mb-2">Suggested Job Titles:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.jobTitleSuggestions.map((title, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">{title}</Badge>
              ))}
            </div>
          </div>
        )}
        {suggestions.companySuggestions && suggestions.companySuggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-foreground mb-2">Suggested Companies:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.companySuggestions.map((company, index) => (
                <Badge key={index} variant="outline" className="text-sm px-3 py-1">{company}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
