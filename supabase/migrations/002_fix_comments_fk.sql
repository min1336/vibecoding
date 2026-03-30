-- Fix: comments.user_id should reference profiles(id) for PostgREST join
-- profiles.id already references auth.users(id) ON DELETE CASCADE

-- Drop old FK to auth.users
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Add new FK to profiles
ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Same fix for likes table
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE likes ADD CONSTRAINT likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
