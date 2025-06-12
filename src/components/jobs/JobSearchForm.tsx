
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getLocationSuggestionsAction } from "@/lib/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SearchFormData {
  keyword?: string;
  Location?: string;
}

export default function JobSearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { token, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch } = useForm<SearchFormData>({
    defaultValues: {
      keyword: searchParams.get("keyword") || "",
      Location: searchParams.get("Location") || "",
    },
  });

  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);

  const fetchLocationSuggestions = useCallback(async () => {
    if (!token || authLoading) {
      return;
    }
    setSuggestionsLoading(true);
    try {
      const locations = await getLocationSuggestionsAction(token);
      setLocationSuggestions(locations.suggestions);
    } catch (error: any) {
      console.error("Failed to fetch location suggestions:", error);
      toast({
        title: "Error",
        description: "Could not load location suggestions. " + error.message,
        variant: "destructive"
      })
    } finally {
      setSuggestionsLoading(false);
    }
  }, [token, authLoading, toast]);

  useEffect(() => {
    fetchLocationSuggestions();
  }, [fetchLocationSuggestions]);

  const onSubmit = (data: SearchFormData) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (params.toString() !== searchParams.toString()) {
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleClearFilters = () => {
    reset({
      keyword: "",
      Location: "",
    });
    router.push(pathname); 
  };
  
  const renderLocationSuggestionPopover = () => (
    <Popover open={openLocation} onOpenChange={setOpenLocation}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={openLocation} 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          disabled={authLoading || !token || suggestionsLoading}
        >
          <MapPin className="mr-2 h-4 w-4" />
          {watch("Location") || "Select location"}
          {suggestionsLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />} 
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Search location..."/>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {locationSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  value={suggestion}
                  onSelect={(currentValue) => {
                    setValue("Location", currentValue === watch("Location") ? "" : currentValue, { shouldDirty: true });
                    setOpenLocation(false);
                    handleSubmit(onSubmit)(); 
                  }}
                >
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (authLoading) {
    return (
      <div className="p-6 bg-card rounded-xl shadow-lg flex items-center justify-center h-[136px] md:h-auto md:min-h-[92px]"> 
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading search filters...</p>
      </div>
    );
  }
  
  if (!user && !token) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 bg-card rounded-xl shadow-lg space-y-4 md:space-y-0 md:grid md:grid-cols-5 md:gap-4 md:items-end">
      <div className="md:col-span-3"> {/* Wider input for keyword search */}
        <label htmlFor="keyword" className="block text-sm font-medium text-foreground mb-1">Search Keyword</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              id="keyword"
              placeholder="e.g. Software Engineer, Marketing, Python"
              {...register("keyword")}
              className="pl-10" 
              disabled={authLoading || !token}
            />
        </div>
      </div>
      
      <div className="md:col-span-1">
        <label htmlFor="Location" className="block text-sm font-medium text-foreground mb-1">Location</label>
        {renderLocationSuggestionPopover()}
      </div>
      
      <div className="md:col-span-1 flex space-x-2">
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={authLoading || !token || suggestionsLoading}>
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
        <Button type="button" variant="outline" onClick={handleClearFilters} className="w-auto" title="Clear Filters" disabled={authLoading || !token || suggestionsLoading}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
