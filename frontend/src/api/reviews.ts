import { supabase } from '../lib/supabase';
import type { LinkedInReview } from '../types';

export interface SubmitReviewParams {
  workshopId: string;
  linkedinUrl: string;
  profileText: string;
}

/**
 * Submit LinkedIn profile text to Supabase Edge Function review-linkedin
 */
export async function submitLinkedInReview({
  workshopId,
  linkedinUrl,
  profileText,
}: SubmitReviewParams): Promise<LinkedInReview> {
  const { data, error } = await supabase.functions.invoke('review-linkedin', {
    body: {
      workshopId,
      linkedinUrl,
      profileText,
    },
  });

  if (error) {
    // If Edge Function returned a JSON error response, supabase.functions.invoke often wraps it
    let message = error.message;
    if (error.context && typeof error.context.json === 'function') {
      try {
        const body = await error.context.json();
        if (body?.error) {
          message = body.error;
        }
      } catch {
        // Ignore json parse error
      }
    }
    throw new Error(message || 'Failed to generate review. Please try again.');
  }

  if (!data || data.error) {
    throw new Error(data?.error || 'Review generation failed');
  }

  return {
    id: data.id,
    userId: data.user_id,
    workshopId: data.workshop_id,
    linkedinUrl: data.linkedin_url,
    overallScore: data.overall_score,
    band: data.band,
    criteria: data.criteria,
    strengths: data.strengths,
    improvements: data.improvements,
    createdAt: data.created_at,
  };
}

/**
 * Fetch all LinkedIn reviews submitted by the authenticated user
 */
export async function listUserLinkedInReviews(): Promise<LinkedInReview[]> {
  const { data, error } = await supabase
    .from('linkedin_reviews')
    .select(`
      id,
      user_id,
      workshop_id,
      linkedin_url,
      overall_score,
      band,
      criteria,
      strengths,
      improvements,
      created_at,
      workshop:workshops (
        title
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    workshopId: row.workshop_id,
    workshopTitle: row.workshop?.title || 'Workshop',
    linkedinUrl: row.linkedin_url,
    overallScore: row.overall_score,
    band: row.band,
    criteria: row.criteria,
    strengths: row.strengths,
    improvements: row.improvements,
    createdAt: row.created_at,
  }));
}

/**
 * Fetch review for a specific workshop if user has one
 */
export async function getReviewForWorkshop(workshopId: string): Promise<LinkedInReview | null> {
  const { data, error } = await supabase
    .from('linkedin_reviews')
    .select('*')
    .eq('workshop_id', workshopId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    workshopId: data.workshop_id,
    linkedinUrl: data.linkedin_url,
    overallScore: data.overall_score,
    band: data.band,
    criteria: data.criteria,
    strengths: data.strengths,
    improvements: data.improvements,
    createdAt: data.created_at,
  };
}
