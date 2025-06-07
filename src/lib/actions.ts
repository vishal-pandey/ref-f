
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
  UserUpdate,
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
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    let responseBodyTextForErrorMessage = null;

    try {
      // Try to parse JSON first.
      // Clone the response if we might need to read the body again (e.g., for text).
      const clonedResponse = response.clone();
      errorData = await response.json();
      
      // If JSON parsing was successful but yielded an empty object,
      // try to get raw text to see if it's more informative.
      if (typeof errorData === 'object' && errorData !== null && Object.keys(errorData).length === 0) {
        responseBodyTextForErrorMessage = await clonedResponse.text();
      }

    } catch (e) {
      // If JSON parsing fails, try to get the response as text
      try {
        // response.text() can only be called once. If .json() failed, the body is still available.
        // If .json() succeeded but was {}, clonedResponse.text() was used above.
        // This path is for when response.json() itself threw an error.
        responseBodyTextForErrorMessage = await response.text(); 
      } catch (textError) {
        responseBodyTextForErrorMessage = "Could not read error response body.";
      }
      // Construct a minimal errorData if JSON parsing failed
      errorData = { message: responseBodyTextForErrorMessage || response.statusText || `HTTP Error ${response.status}` };
    }

    // If errorData is an empty object from a successful .json() call,
    // make the logged object more informative using statusText.
    const loggedErrorData = (typeof errorData === 'object' && errorData !== null && Object.keys(errorData).length === 0 && response.statusText)
      ? { message: response.statusText, originalData: errorData, rawText: responseBodyTextForErrorMessage }
      : errorData;

    console.error(`API Error (${response.status}) on ${endpoint}:`, loggedErrorData);
    
    // Construct a more detailed error message
    const detailMessage = 
      loggedErrorData?.detail?.[0]?.msg || // FastAPI validation structure
      loggedErrorData?.detail ||           // FastAPI simple string detail
      loggedErrorData?.message ||          // General message property
      (responseBodyTextForErrorMessage && responseBodyTextForErrorMessage.trim() !== "{}" ? responseBodyTextForErrorMessage : null) || // Use raw text if it's not just an empty JSON
      response.statusText ||             // Fallback to HTTP status text
      `Request failed`;                  // Ultimate fallback part

    const errorMessage = `${detailMessage} (Status: ${response.status})`;

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

export async function updateUserAction(data: UserUpdate, token: string): Promise<User> {
  if (!token) throw new Error("Authentication token is required to update user details.");
  return fetchAPI("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
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
