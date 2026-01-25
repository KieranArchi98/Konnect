-- SQL to create a test user directly in Supabase
-- Run this in Supabase SQL Editor

-- First, generate a password hash using Python:
-- python -c "import bcrypt; print(bcrypt.hashpw(b'TestPassword123!', bcrypt.gensalt()).decode())"
-- Then replace the hash below

-- Delete existing test user if exists
DELETE FROM public.users WHERE email = 'test@example.com';

-- Insert test user
-- Replace the password_hash below with a hash generated from the Python command above
INSERT INTO public.users (
    email, 
    password_hash, 
    display_name, 
    auth_provider, 
    email_verified, 
    level, 
    elo, 
    is_active, 
    preferences
) VALUES (
    'test@example.com',
    '$2b$12$YOUR_HASH_HERE',  -- Replace with actual hash
    'Test User',
    'email',
    true,
    1,
    0,
    true,
    '{}'
);

-- Test credentials:
-- Email: test@example.com
-- Password: TestPassword123!
