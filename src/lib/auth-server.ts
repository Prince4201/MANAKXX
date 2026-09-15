import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Role } from './manakx/types';

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

type CreateAdminUserData = {
  token: string;
  email: string;
  name: string;
  role: Role;
  metadata?: Record<string, string>;
};

export const createAdminUser = createServerFn({ method: 'POST' })
  .validator((data: CreateAdminUserData) => data)
  .handler(async ({ data }) => {
    const supabase = getAdminSupabase();

    // 1. Verify caller is Admin securely
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'Admin') throw new Error("Forbidden: Only Administrators can create users.");

    // 2. Create the user
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'; 

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: data.role,
        force_active: true,
        ...data.metadata
      },
    });

    if (userError) {
      throw new Error(userError.message);
    }
    
    // 3. Securely create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `Created user ${data.email} as ${data.role}`,
      entity: "User Management",
      entity_id: userData.user.id,
    });

    return { success: true, user: userData.user };
  });
