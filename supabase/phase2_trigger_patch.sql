-- Run this in the Supabase SQL Editor
-- This upgrades the Bootstrap Trigger to understand when an Admin 
-- is adding a student/teacher versus when a brand new school is signing up.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    assigned_school_id UUID;
    assigned_role public.user_role;
BEGIN
    -- Check if the Edge Function securely passed a school_id in metadata
    IF new.raw_user_meta_data->>'school_id' IS NOT NULL THEN
        assigned_school_id := (new.raw_user_meta_data->>'school_id')::UUID;
        assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'student')::public.user_role;
    ELSE
        -- No school provided? This is a brand new SaaS signup! Create a new school.
        INSERT INTO public.schools (name) 
        VALUES (COALESCE(new.raw_user_meta_data->>'school_name', 'My New School')) 
        RETURNING id INTO assigned_school_id;
        
        assigned_role := 'admin'::public.user_role;
    END IF;

    -- Create their profile properly linked to the right school
    INSERT INTO public.profiles (id, first_name, last_name, role, school_id)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        assigned_role,
        assigned_school_id
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
