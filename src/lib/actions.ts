
import type {
  JobPostCreate,
  JobPostUpdate,
  OTPRequest,
  OTPVerify,
  Token,
  Msg,
  JobPostInDB,
  SuggestionList,
  JobFilters,
  User,
} from "./types";
import { API_BASE_URL } from "./config";

async function fetchAPI(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<any> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  } else if (!endpoint.startsWith("/auth/")) { // Do not throw for auth endpoints themselves
    // Throw an error if token is required but not provided for non-auth endpoints
    // This check assumes all non-auth endpoints now require a token
    // console.warn(`Token not provided for protected endpoint: ${endpoint}`);
    // throw new Error("Authentication token is required for this action.");
  }


  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    console.error(`API Error (${response.status}) on ${endpoint}:`, errorData);
    const errorMessage = errorData.detail?.[0]?.msg || errorData.detail || errorData.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) { // No Content
    return null;
  }
  return response.json();
}

// Auth Actions
export async function requestOtpAction(data: OTPRequest): Promise<Msg> {
  return fetchAPI("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyOtpAction(data: OTPVerify): Promise<Token> {
  const tokenData: Token = await fetchAPI("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return tokenData;
}

// User Actions
export async function getCurrentUserAction(token: string): Promise<User> {
  if (!token) throw new Error("Authentication token is required to fetch user details.");
  return fetchAPI("/users/me", {}, token);
}


// Job Actions
export async function createJobAction(data: JobPostCreate, token: string): Promise<JobPostInDB> {
  if (!token) throw new Error("Authentication token is required to create a job.");
  const job = await fetchAPI("/jobs/", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
  return job;
}

export async function getJobsAction(filters: JobFilters, token: string | null): Promise<JobPostInDB[]> {
  if (!token) throw new Error("Authentication token is required to fetch jobs.");
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  return fetchAPI(`/jobs/?${queryParams.toString()}`, {}, token);
}

export async function getJobByIdAction(jobId: string, token: string | null): Promise<JobPostInDB> {
  if (!token) throw new Error("Authentication token is required to fetch job details.");
  return fetchAPI(`/jobs/${jobId}`, {}, token);
}

export async function updateJobAction(jobId: string, data: JobPostUpdate, token: string): Promise<JobPostInDB> {
  if (!token) throw new Error("Authentication token is required to update a job.");
  const job = await fetchAPI(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
  return job;
}

export async function deleteJobAction(jobId: string, token: string): Promise<void> {
  if (!token) throw new Error("Authentication token is required to delete a job.");
  await fetchAPI(`/jobs/${jobId}`, {
    method: "DELETE",
  }, token);
}

// Suggestion Actions
export async function getRoleNameSuggestionsAction(token: string | null): Promise<SuggestionList> {
  if (!token) throw new Error("Authentication token is required for suggestions.");
  return fetchAPI("/jobs/suggestions/role-names", {}, token);
}

export async function getCompanyNameSuggestionsAction(token: string | null): Promise<SuggestionList> {
  if (!token) throw new Error("Authentication token is required for suggestions.");
  return fetchAPI("/jobs/suggestions/company-names", {}, token);
}

export async function getLocationSuggestionsAction(token: string | null): Promise<SuggestionList> {
  if (!token) throw new Error("Authentication token is required for suggestions.");
  return fetchAPI("/jobs/suggestions/locations", {}, token);
}

export async function getDepartmentNameSuggestionsAction(token: string | null): Promise<SuggestionList> {
  if (!token) throw new Error("Authentication token is required for suggestions.");
  return fetchAPI("/jobs/suggestions/department-names", {}, token);
}
