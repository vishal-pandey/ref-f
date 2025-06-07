"use server";

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
import { cookies } from 'next/headers';
import { revalidatePath } from "next/cache";

async function getAuthToken(): Promise<string | undefined> {
  // In server actions, if you store token in httpOnly cookie, access it here.
  // For this example, assuming token might be passed or handled differently for server-to-server.
  // If called from client components that pass token, use that.
  // For actions called directly (e.g. after login), token might not be in cookies yet if set client-side.
  // This is a placeholder; robust token handling depends on where it's stored.
  // For simplicity, let's assume client will eventually have the token and API calls needing it will manage this.
  // The provided API uses Bearer tokens, typically sent in Authorization header.
  // If using cookies for session management by NextAuth.js or similar, it would be different.
  // For direct external API calls from server actions, the token needs to be retrieved from wherever it's stored securely.
  // For now, we'll assume some actions need a token passed to them or fetched from secure storage.

  // The API spec includes "security": [{ "Bearer": [] }] for protected routes.
  // We need a way to get this Bearer token.
  // If login action sets an httpOnly cookie, it can be read here.
  // For this example, we'll assume the token is stored in a cookie named 'authToken'
  // This is a simplified approach. In production, use secure httpOnly cookies.
  const cookieStore = cookies();
  return cookieStore.get('sessionToken')?.value;
}


async function fetchAPI(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const authToken = token || await getAuthToken();
  if (authToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${authToken}`;
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
  // Store token in an httpOnly cookie for server-side access
  // This is more secure than localStorage for tokens.
  if (tokenData.access_token) {
    cookies().set('sessionToken', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }
  return tokenData;
}

export async function logoutAction(): Promise<void> {
  cookies().delete('sessionToken');
  // Optionally call a backend logout endpoint if it exists
  // await fetchAPI("/auth/logout", { method: "POST" });
}


// Job Actions
export async function createJobAction(data: JobPostCreate, token: string): Promise<JobPostInDB> {
  const job = await fetchAPI("/jobs/", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
  revalidatePath("/admin");
  revalidatePath("/");
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
  return fetchAPI(`/jobs/?${queryParams.toString()}`);
}

export async function getJobByIdAction(jobId: string): Promise<JobPostInDB> {
  return fetchAPI(`/jobs/${jobId}`);
}

export async function updateJobAction(jobId: string, data: JobPostUpdate, token: string): Promise<JobPostInDB> {
  const job = await fetchAPI(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
  revalidatePath(`/admin`);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
  return job;
}

export async function deleteJobAction(jobId: string, token: string): Promise<void> {
  await fetchAPI(`/jobs/${jobId}`, {
    method: "DELETE",
  }, token);
  revalidatePath("/admin");
  revalidatePath("/");
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
