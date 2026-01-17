const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  const username = 'admin';
  const password = 'Password@123';
  const saltRounds = 10;
  
  console.log(`Hashing password for ${username}...`);
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const adminData = {
    username,
    password: hashedPassword,
    email: 'admin@cis.gov.in',
    name: 'System Administrator',
    role: 'administrator',
    phone: '+919999999999',
    department: 'Cyber Intelligence Unit',
    designation: 'Chief Administrator',
    is_active: true,
    face_registered: false,
    otp_verified: false,
    face_verified: false,
    created_at: new Date().toISOString(),
  };

  console.log('Checking if user already exists...');
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (existingUser) {
    console.log(`User ${username} already exists with ID: ${existingUser.id}`);
    
    console.log(`Updating password for ${username}...`);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, role: 'administrator' })
      .eq('id', existingUser.id);
      
    if (updateError) {
      console.error('Error updating user:', updateError);
    } else {
      console.log('User updated successfully!');
    }
    return;
  }

  console.log('Inserting admin user...');
  const { data, error } = await supabase
    .from('users')
    .insert(adminData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating admin user:', error);
    if (error.code === '42P01') {
      console.error('Hint: The "users" table might not exist in Supabase.');
    }
  } else {
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: Password@123');
    console.log(`User ID: ${data.id}`);
  }
}

createAdminUser().catch(err => {
  console.error('Unexpected error:', err);
});
