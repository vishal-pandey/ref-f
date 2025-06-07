"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Briefcase, Building, MapPin, Users } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  getRoleNameSuggestionsAction,
  getCompanyNameSuggestionsAction,
  getLocationSuggestionsAction,
  getDepartmentNameSuggestionsAction
} from "@/lib/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface SearchFormData {
  RoleName?: string;
  CompanyName?: string;
  Location?: string;
  DepartmentName?: string;
}

export default function JobSearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { register, handleSubmit, reset, setValue, watch } = useForm<SearchFormData>({
    defaultValues: {
      RoleName: searchParams.get("RoleName") || "",
      CompanyName: searchParams.get("CompanyName") || "",
      Location: searchParams.get("Location") || "",
      DepartmentName: searchParams.get("DepartmentName") || "",
    },
  });

  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [departmentSuggestions, setDepartmentSuggestions] = useState<string[]>([]);

  const [openRole, setOpenRole] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [openDepartment, setOpenDepartment] = useState(false);

  const watchedRoleName = watch("RoleName");
  const watchedCompanyName = watch("CompanyName");
  const watchedLocation = watch("Location");
  const watchedDepartmentName = watch("DepartmentName");


  const fetchSuggestions = useCallback(async () => {
    try {
      // For simplicity, fetching all suggestions initially. Could be optimized to fetch based on input.
      setRoleSuggestions((await getRoleNameSuggestionsAction()).suggestions);
      setCompanySuggestions((await getCompanyNameSuggestionsAction()).suggestions);
      setLocationSuggestions((await getLocationSuggestionsAction()).suggestions);
      setDepartmentSuggestions((await getDepartmentNameSuggestionsAction()).suggestions);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const onSubmit = (data: SearchFormData) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    reset({
      RoleName: "",
      CompanyName: "",
      Location: "",
      DepartmentName: "",
    });
    router.push(pathname);
  };
  
  const renderSuggestionPopover = (
    fieldName: keyof SearchFormData,
    suggestions: string[],
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    placeholder: string,
    Icon: React.ElementType
  ) => (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={isOpen} className="w-full justify-between text-muted-foreground hover:text-foreground">
          <Icon className="mr-2 h-4 w-4" />
          {watch(fieldName) || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  value={suggestion}
                  onSelect={(currentValue) => {
                    setValue(fieldName, currentValue === watch(fieldName) ? "" : currentValue, { shouldDirty: true });
                    setIsOpen(false);
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


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 bg-card rounded-xl shadow-lg space-y-4 md:space-y-0 md:grid md:grid-cols-5 md:gap-4 md:items-end">
      <div className="md:col-span-1">
        <label htmlFor="RoleName" className="block text-sm font-medium text-foreground mb-1">Role Name</label>
        {renderSuggestionPopover("RoleName", roleSuggestions, openRole, setOpenRole, "e.g. Developer", Briefcase)}
      </div>
      <div className="md:col-span-1">
        <label htmlFor="CompanyName" className="block text-sm font-medium text-foreground mb-1">Company</label>
         {renderSuggestionPopover("CompanyName", companySuggestions, openCompany, setOpenCompany, "e.g. Acme Corp", Building)}
      </div>
      <div className="md:col-span-1">
        <label htmlFor="Location" className="block text-sm font-medium text-foreground mb-1">Location</label>
        {renderSuggestionPopover("Location", locationSuggestions, openLocation, setOpenLocation, "e.g. New York", MapPin)}
      </div>
      <div className="md:col-span-1">
        <label htmlFor="DepartmentName" className="block text-sm font-medium text-foreground mb-1">Department</label>
        {renderSuggestionPopover("DepartmentName", departmentSuggestions, openDepartment, setOpenDepartment, "e.g. Engineering", Users)}
      </div>
      
      <div className="md:col-span-1 flex space-x-2">
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
        <Button type="button" variant="outline" onClick={handleClearFilters} className="w-auto" title="Clear Filters">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
