
-- Allow authenticated users to create project templates
CREATE POLICY "Authenticated users can create templates"
ON public.project_templates FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow template creators to delete (by category = custom)
CREATE POLICY "Users can delete custom templates"
ON public.project_templates FOR DELETE TO authenticated
USING (category = 'custom');
