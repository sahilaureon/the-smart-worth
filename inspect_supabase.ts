import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rjhvroxdljbnqcysglil.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log('Connecting to:', supabaseUrl);
  
  try {
    const { data: pkgs, error: pErr } = await supabase.from('packages').select('*');
    if (pErr) console.error('Error fetching packages:', pErr);
    else {
      console.log('Successfully fetched packages. Count:', pkgs?.length);
      console.log('Package 0 details:', JSON.stringify(pkgs?.[0], null, 2));
    }

    const { data: courses, error: cErr } = await supabase.from('courses').select('*');
    if (cErr) console.error('Error fetching courses:', cErr);
    else {
      console.log('Successfully fetched courses. Count:', courses?.length);
      console.log('Course 0 details:', JSON.stringify(courses?.[0], null, 2));
    }
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
