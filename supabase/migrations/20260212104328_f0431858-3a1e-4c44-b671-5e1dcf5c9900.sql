
-- ==========================================
-- AIVA Flow Database Schema
-- ==========================================

-- 1. Enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.idea_status AS ENUM ('raw', 'processing', 'converted', 'archived');
CREATE TYPE public.report_type AS ENUM ('daily', 'weekly', 'custom');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  language TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- 3. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- 4. Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  color TEXT DEFAULT '#0A26E6',
  icon TEXT DEFAULT 'folder',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. Project members (join table)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Project RLS: owner or member can access
CREATE POLICY "Project members can view projects" ON public.projects FOR SELECT
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid()));
CREATE POLICY "Owners can insert projects" ON public.projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update projects" ON public.projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete projects" ON public.projects FOR DELETE USING (owner_id = auth.uid());

-- Project members RLS
CREATE POLICY "Members can view project members" ON public.project_members FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));
CREATE POLICY "Owners can manage project members" ON public.project_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));
CREATE POLICY "Owners can remove project members" ON public.project_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()) OR user_id = auth.uid());

-- 6. Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'backlog',
  priority task_priority DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  labels TEXT[] DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  source_idea_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view tasks" ON public.tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid()));
CREATE POLICY "Project members can create tasks" ON public.tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid()));
CREATE POLICY "Project members can update tasks" ON public.tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid()));
CREATE POLICY "Project members can delete tasks" ON public.tasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid()));

-- 7. Ideas table
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_text TEXT NOT NULL,
  ai_summary TEXT,
  ai_tasks JSONB DEFAULT '[]',
  status idea_status DEFAULT 'raw',
  source_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view ideas" ON public.ideas FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = ideas.project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects WHERE id = ideas.project_id AND owner_id = auth.uid()));
CREATE POLICY "Users can create ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their ideas" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their ideas" ON public.ideas FOR DELETE USING (auth.uid() = user_id);

-- 8. Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type report_type DEFAULT 'daily',
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  generated_by TEXT DEFAULT 'ai',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view reports" ON public.reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = reports.project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects WHERE id = reports.project_id AND owner_id = auth.uid()));
CREATE POLICY "System can create reports" ON public.reports FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = reports.project_id AND owner_id = auth.uid()));

-- 9. Invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  status invitation_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviters can view invitations" ON public.invitations FOR SELECT
  USING (invited_by = auth.uid() OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));
CREATE POLICY "Project owners can create invitations" ON public.invitations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));
CREATE POLICY "Project owners can delete invitations" ON public.invitations FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

-- 10. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');
CREATE POLICY "Users can view their project files" ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their files" ON storage.objects FOR DELETE
  USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 13. Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
