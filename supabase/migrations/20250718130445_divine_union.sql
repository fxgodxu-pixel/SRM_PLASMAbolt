/*
  # Fix departments table RLS policy

  1. Security Changes
    - Update RLS policy to allow public access to departments table
    - This enables the application to work with anonymous Supabase client

  2. Changes Made
    - Modified policy to use `TO public` instead of `TO authenticated`
    - Maintains same permissions but allows anonymous access
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow all operations on departments" ON departments;

-- Create new policy that allows public access
CREATE POLICY "Allow all operations on departments"
  ON departments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
