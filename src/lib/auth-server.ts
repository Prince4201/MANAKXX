import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getAdminSupabase = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables missing for admin client.');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createAdminUser = createServerFn({ method: 'POST' })
  .validator((data: { email: string; name: string; role: 'Admin' | 'Technical Reviewer' }) => data)
  .handler(async ({ data }) => {
    // We only execute this on the server
    const supabase = getAdminSupabase();

    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'; 

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: data.role,
      },
    });

    if (userError) {
      throw new Error(userError.message);
    }

    return { success: true, user: userData.user };
  });
