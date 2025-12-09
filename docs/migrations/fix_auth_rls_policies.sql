-- Fix RLS Policies for Authentication
-- Run this in Supabase SQL Editor to fix login issues

-- ============================================================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- ============================================================================

-- Drop existing profile policies that may be blocking
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Drop existing user_roles policies that may be blocking
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Drop existing roles policies
DROP POLICY IF EXISTS "All users can view roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;

-- ============================================================================
-- CREATE PERMISSIVE POLICIES FOR AUTHENTICATION
-- ============================================================================

-- PROFILES TABLE
-- Allow all authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup (via triggers or service role)
CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- USER_ROLES TABLE
-- Allow users to read their own roles (critical for auth)
CREATE POLICY "Users can read own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to insert their own roles (for signup)
CREATE POLICY "Users can insert own roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ROLES TABLE
-- Allow all authenticated users to view roles (needed to display role info)
CREATE POLICY "Authenticated users can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- OPTIONAL: Create service role bypass for admin operations
-- ============================================================================

-- If you need admin operations on profiles, create policies using service role
-- or create admin-specific policies:

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admin can update any profile
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admin can manage all user roles
CREATE POLICY "Admins can manage all user roles"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Admin can manage roles table
CREATE POLICY "Admins can manage roles"
ON roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ============================================================================
-- VERIFY RLS IS ENABLED
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TEST: Check your policies are working
-- ============================================================================
-- Run this to verify:
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'user_roles', 'roles');

