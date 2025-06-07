
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
} from "./types";
import { API_BASE_URL } from "./config";

// Removed "use server";, cookies, revalidatePath as these are now client-side functions

async function fetchAPI(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null // Token is now explicitly passed
): Promise<any> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
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
    throw new Error(errorData.detail?.[0]?.msg || errorData.message || `Request failed with status ${response.status}`);
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
  // Token is handled by AuthContext on the client, no httpOnly cookie setting here
  return tokenData;
}

// Job Actions
export async function createJobAction(data: JobPostCreate, token: string): Promise<JobPostInDB> {
  const job = await fetchAPI("/jobs/", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
  // revalidatePath removed
  return job;
}

export async function getJobsAction(filters?: JobFilters): Promise<JobPostInDB[]> {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  // Assuming this is a public endpoint or token is handled by API if always required for GET
  return fetchAPI(`/jobs/?${queryParams.toString()}`);
}

export async function getJobByIdAction(jobId: string): Promise<JobPostInDB> {
  // Assuming this is a public endpoint or token is handled by API if always required for GET
  return fetchAPI(`/jobs/${jobId}`);
}

export async function updateJobAction(jobId: string, data: JobPostUpdate, token: string): Promise<JobPostInDB> {
  const job = await fetchAPI(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
  // revalidatePath removed
  return job;
}

export async function deleteJobAction(jobId: string, token: string): Promise<void> {
  await fetchAPI(`/jobs/${jobId}`, {
    method: "DELETE",
  }, token);
  // revalidatePath removed
}

// Suggestion Actions
export async function getRoleNameSuggestionsAction(): Promise<SuggestionList> {
  return fetchAPI("/jobs/suggestions/role-names");
}

export async function getCompanyNameSuggestionsAction(): Promise<SuggestionList> {
  return fetchAPI("/jobs/suggestions/company-names");
}

export async function getLocationSuggestionsAction(): Promise<SuggestionList> {
  return fetchAPI("/jobs/suggestions/locations");
}

export async function getDepartmentNameSuggestionsAction(): Promise<SuggestionList> {
  return fetchAPI("/jobs/suggestions/department-names");
}
