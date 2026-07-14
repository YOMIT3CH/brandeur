-- Add RLS policies for profiles table
-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Allow anyone to view profiles (for admin panel)
-- Note: This is a simple approach - in production, you should restrict this
CREATE POLICY "Allow public read access to profiles"
    ON profiles FOR SELECT
    USING (true);

-- Allow anyone to update profiles (for admin panel)
-- Note: This is a simple approach - in production, you should restrict this
CREATE POLICY "Allow public update access to profiles"
    ON profiles FOR UPDATE
    USING (true);

-- Allow anyone to delete profiles (for admin panel)
-- Note: This is a simple approach - in production, you should restrict this
CREATE POLICY "Allow public delete access to profiles"
    ON profiles FOR DELETE
    USING (true);
