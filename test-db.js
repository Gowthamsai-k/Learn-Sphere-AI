const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('KEY Length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

const test = async () => {
  try {
    const email = `test-${Date.now()}@domain.com`;
    const passwordHash = await bcrypt.hash('password123', 10);
    
    console.log('Inserting into users...');
    const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert({
            name: 'Test User',
            email,
            password_hash: passwordHash
        })
        .select()
        .single();

    if (insertErr) {
      console.error('Insert User Error:', insertErr);
      return;
    }

    console.log('Inserted User:', newUser);

    console.log('Inserting into user_progress...');
    const { data: progress, error: progErr } = await supabase.from('user_progress').insert({
        user_id: newUser.id,
        current_level: 'Medium',
        correct_streak: 0,
        total_questions_solved: 0
    }).select();

    if (progErr) {
      console.error('Insert Progress Error:', progErr);
      return;
    }

    console.log('Inserted Progress:', progress);
  } catch (err) {
    console.error('Caught Exception:', err);
  }
};

test();
