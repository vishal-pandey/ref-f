
export interface JobPostCreate {
  RoleName: string;
  DepartmentName?: string | null;
  Location?: string | null;
  CompanyName: string;
  ContactEmail?: string | null;
  ApplicationLink?: string | null;
  JobDescription: string;
  ReferralStatus?: string | null;
}

export interface JobPostInDB extends JobPostCreate {
  id: string;
  PostingDate: string; // date-time
}

export interface JobPostUpdate {
  RoleName?: string | null;
  DepartmentName?: string | null;
  Location?: string | null;
  CompanyName?: string | null;
  ContactEmail?: string | null;
  ApplicationLink?: string | null;
  JobDescription?: string | null;
  ReferralStatus?: string | null;
}

export interface OTPRequest {
  email?: string | null;
  mobile_number?: string | null;
}

export interface OTPVerify {
  email?: string | null;
  mobile_number?: string | null;
  otp_code: string;
}

export interface Token {
  access_token: string;
  token_type?: string;
}

export interface Msg {
  msg: string;
}

export interface SuggestionList {
  suggestions: string[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface User {
  id: number;
  email?: string | null;
  mobile_number?: string | null;
  full_name?: string | null; // Added full_name
  is_active: boolean;
  is_admin: boolean;
  created_at: string; // date-time
  updated_at: string; // date-time
}

export interface UserUpdate {
  full_name?: string | null;
  mobile_number?: string | null;
}

export interface JobFilters {
  Location?: string;
  keyword?: string;
  skip?: number;
  limit?: number;
}

