import { Post } from '../types';

/**
 * Checks if a post is scheduled in the future relative to the current time.
 */
export function isFutureScheduled(post: Post, now: Date = new Date()): boolean {
  if (post.status !== 'scheduled') return false;
  const postTime = new Date(post.scheduled_at).getTime();
  return postTime > now.getTime();
}

/**
 * Checks if a post is a draft.
 */
export function isDraftPost(post: Post): boolean {
  return post.status === 'draft';
}

/**
 * Rule: Relative to the current time, future scheduled posts and drafts can be deleted.
 * Already published posts in the past cannot be retracted from the scheduler.
 */
export function canDeletePost(
  post: Post,
  now: Date = new Date()
): { allowed: boolean; reason?: string; type: 'draft' | 'future_scheduled' | 'past_scheduled' | 'published' } {
  if (post.status === 'draft') {
    return {
      allowed: true,
      type: 'draft',
    };
  }

  const postTime = new Date(post.scheduled_at).getTime();
  const isFuture = postTime > now.getTime();

  if (isFuture && post.status === 'scheduled') {
    return {
      allowed: true,
      type: 'future_scheduled',
    };
  }

  if (post.status === 'failed') {
    return {
      allowed: true,
      type: 'future_scheduled',
    };
  }

  if (post.status === 'published') {
    return {
      allowed: false,
      reason: 'A poszt már közzétételre került, az időzítőből nem vonható vissza.',
      type: 'published',
    };
  }

  // If scheduled time is already in the past but not published
  return {
    allowed: true,
    type: 'past_scheduled',
  };
}

/**
 * Human friendly Hungarian time diff
 */
export function formatFutureTimeRemaining(scheduledAt: string, now: Date = new Date()): string {
  const target = new Date(scheduledAt).getTime();
  const diffMs = target - now.getTime();

  if (diffMs <= 0) return 'Múltbeli időpont';

  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} perc múlva`;

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} óra múlva`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} nap múlva`;
}
