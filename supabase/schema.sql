-- 1. Create custom ENUM types for application states (Optional but recommended for data integrity, using TEXT with check constraints here for Supabase simplicity)
-- Alternatively, we can just use TEXT with CHECK constraints as defined below.

-- 1. users table
-- Links to the private auth.users table maintained by Supabase
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  department TEXT
);

-- 2. categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT NOT NULL
);

-- 3. tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'escalated', 'closed')) DEFAULT 'open',
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger function to automatically update the timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to exactly tickets
CREATE TRIGGER track_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- 4. responses table
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 5. notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Enable RLS for all tables so your API is secure from unauthorized access.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Users
-- Everyone can read users to map names, but nobody can arbitrarily insert/update unless Admin (or Trigger)
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow Admin update users" ON public.users FOR UPDATE USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- 2. Categories
-- Read: Everyone
-- Write/Update/Delete: Admins ONLY
CREATE POLICY "Allow read categories" ON public.categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin write categories" ON public.categories FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- 3. Tickets
-- Read: Originating Student OR Assigned Staff OR Admin
CREATE POLICY "Tickets Select Policy" ON public.tickets FOR SELECT USING (
  auth.uid() = student_id
  OR auth.uid() = assigned_to
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
-- Insert: Students can create tickets where they are the student_id
CREATE POLICY "Tickets Insert Policy" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = student_id);
-- Update: Assigned Staff OR Admin
CREATE POLICY "Tickets Update Policy" ON public.tickets FOR UPDATE USING (
  auth.uid() = assigned_to
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 4. Responses
-- Read/Write: Tied explicitely to the Ticket lookup chain
CREATE POLICY "Responses Select Policy" ON public.responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
    AND (
      t.student_id = auth.uid()
      OR t.assigned_to = auth.uid()
      OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    )
  )
);
CREATE POLICY "Responses Insert Policy" ON public.responses FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
    AND (
      t.student_id = auth.uid()
      OR t.assigned_to = auth.uid()
      OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    )
  )
);

-- 5. Notifications
-- Select/Update: Only the explicit owner of the notification. 
-- Insert: Authenticated users can insert notifications targeted at others.
CREATE POLICY "Notifications Select Policy" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications Update Policy" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Notifications Insert Policy" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Trigger to automatically create a user record in public.users when a new user signs up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'department'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
