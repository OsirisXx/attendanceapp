CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'student',
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
