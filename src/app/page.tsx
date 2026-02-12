import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
