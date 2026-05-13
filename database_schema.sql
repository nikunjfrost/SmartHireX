-- Run this in the Supabase SQL Editor to initialize your tables

CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  experience TEXT,
  match_score INTEGER,
  ats_score INTEGER,
  status TEXT DEFAULT 'pending',
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert some demo data so the dashboard isn't completely empty!
INSERT INTO candidates (name, title, location, experience, match_score, ats_score, status, skills)
VALUES 
  ('Sarah Jenkins', 'Senior Frontend Engineer', 'San Francisco, CA', '8 Years', 94, 92, 'pending', ARRAY['React', 'TypeScript', 'Node.js', 'System Design']),
  ('Michael Chen', 'Full Stack Developer', 'New York, NY', '5 Years', 88, 85, 'pending', ARRAY['Python', 'Django', 'React', 'AWS']),
  ('Emily Rodriguez', 'UI/UX Designer', 'Remote', '6 Years', 82, 78, 'pending', ARRAY['Figma', 'Prototyping', 'User Research', 'CSS']),
  ('David Kim', 'Backend Engineer', 'Seattle, WA', '4 Years', 76, 80, 'pending', ARRAY['Java', 'Spring Boot', 'PostgreSQL', 'Docker']),
  ('Lisa Patel', 'Product Manager', 'Austin, TX', '7 Years', 71, 75, 'pending', ARRAY['Agile', 'Jira', 'Product Strategy', 'Data Analysis']);
