require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data, error } = await supabase.from('mess_members').select('id, is_manual').limit(1);
    if (error) {
        console.error("DB Error:", error);
    } else {
        console.log("DB Success, rows:", data.length);
    }
}

run();
