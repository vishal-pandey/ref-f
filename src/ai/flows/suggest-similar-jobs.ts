'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting similar job titles and companies
 * based on user input.
 *
 * @exports suggestSimilarJobs - An async function that takes user input and returns
 *                             suggestions for job titles and companies.
 * @exports SuggestSimilarJobsInput - The input type for suggestSimilarJobs, defining the
 *                                 structure of the user input.
 * @exports SuggestSimilarJobsOutput - The output type for suggestSimilarJobs, defining the
 *                                  structure of the suggestions returned.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarJobsInputSchema = z.object({
  userInput: z
    .string()
    .describe('The user input string to generate job title and company suggestions for.'),
});
export type SuggestSimilarJobsInput = z.infer<typeof SuggestSimilarJobsInputSchema>;

const SuggestSimilarJobsOutputSchema = z.object({
  jobTitleSuggestions: z
    .array(z.string())
    .describe('An array of suggested job titles based on the user input.'),
  companySuggestions: z
    .array(z.string())
    .describe('An array of suggested company names based on the user input.'),
});
export type SuggestSimilarJobsOutput = z.infer<typeof SuggestSimilarJobsOutputSchema>;

export async function suggestSimilarJobs(input: SuggestSimilarJobsInput): Promise<SuggestSimilarJobsOutput> {
  return suggestSimilarJobsFlow(input);
}

const suggestSimilarJobsPrompt = ai.definePrompt({
  name: 'suggestSimilarJobsPrompt',
  input: {schema: SuggestSimilarJobsInputSchema},
  output: {schema: SuggestSimilarJobsOutputSchema},
  prompt: `You are a job suggestion service. Given the following user input, provide suggestions for job titles and companies that the user might be interested in.  Return the output in JSON format.

User Input: {{{userInput}}}

Do not include any introductory or concluding sentences.
`,
});

const suggestSimilarJobsFlow = ai.defineFlow(
  {
    name: 'suggestSimilarJobsFlow',
    inputSchema: SuggestSimilarJobsInputSchema,
    outputSchema: SuggestSimilarJobsOutputSchema,
  },
  async input => {
    const {output} = await suggestSimilarJobsPrompt(input);
    return output!;
  }
);
