'use server';

/**
 * @fileOverview A flow to recommend training resources for a given job description.
 *
 * - recommendTrainingResources - A function that recommends training resources based on a job description.
 * - RecommendTrainingResourcesInput - The input type for the recommendTrainingResources function.
 * - RecommendTrainingResourcesOutput - The return type for the recommendTrainingResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendTrainingResourcesInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
});
export type RecommendTrainingResourcesInput = z.infer<
  typeof RecommendTrainingResourcesInputSchema
>;

const RecommendTrainingResourcesOutputSchema = z.object({
  trainingResources: z
    .array(z.string())
    .describe('A list of recommended online training resources.'),
});
export type RecommendTrainingResourcesOutput = z.infer<
  typeof RecommendTrainingResourcesOutputSchema
>;

export async function recommendTrainingResources(
  input: RecommendTrainingResourcesInput
): Promise<RecommendTrainingResourcesOutput> {
  return recommendTrainingResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendTrainingResourcesPrompt',
  input: {schema: RecommendTrainingResourcesInputSchema},
  output: {schema: RecommendTrainingResourcesOutputSchema},
  prompt: `You are a helpful assistant that recommends online training resources (e.g., courses, tutorials, documentation) to help users prepare for a job, based on the job description.  The output should be a JSON array of strings.

Job Description: {{{jobDescription}}} `,
});

const recommendTrainingResourcesFlow = ai.defineFlow(
  {
    name: 'recommendTrainingResourcesFlow',
    inputSchema: RecommendTrainingResourcesInputSchema,
    outputSchema: RecommendTrainingResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
