CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'student',
  email TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  year_level TEXT,
  school_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


