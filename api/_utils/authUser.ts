import { createSupabaseAdmin } from './supabaseAdmin';

export const getAuthenticatedUser = async (req: any) => {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing bearer token' };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return { user: null, error: 'Missing bearer token' };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: error?.message || 'Unauthorized' };
  }

  return { user: data.user, error: null };
};
