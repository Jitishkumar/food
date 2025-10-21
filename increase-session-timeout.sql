-- Increase JWT token expiry to 1 year (31536000 seconds)
-- Run this in your Supabase SQL Editor

-- This extends the session lifetime so users stay logged in longer
ALTER DATABASE postgres SET app.jwt_exp = '31536000';

-- Refresh the configuration
SELECT pg_reload_conf();

-- Note: You should also go to:
-- Supabase Dashboard → Authentication → Settings → JWT Expiry
-- And set it to a longer duration (e.g., 31536000 seconds = 1 year)
