// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from './cors.ts'

console.log("Create-Tenant-User Function Booted Up.")

serve(async (req) => {
  // 1. Handle CORS Preflight requests for browsers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Extract Authorization Header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    const token = authHeader.replace('Bearer ', '')

    // 3. Initialize Supabase Clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase Environment Variables on Server.')
    }

    // Client for verifying the caller's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Admin Client for bypassing RLS to create users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Verify Caller is an Admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized Access: Invalid Token.')
    }

    // Get Caller's Profile to check Role and School_ID
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) {
      throw new Error('Unauthorized Access: Profile not found.')
    }

    if (callerProfile.role !== 'admin') {
      throw new Error('Forbidden: Only Administrators can create users.')
    }

    const schoolId = callerProfile.school_id
    if (!schoolId) {
      throw new Error('Forbidden: Admin is not assigned to a school.')
    }

    // 5. Parse Request Body
    const { id, email, password, first_name, last_name, role, action } = await req.json()

    if (action === 'update' || id) {
      if (!id) {
        throw new Error('Missing id for update.')
      }

      const updateData: any = {};
      if (password) updateData.password = password;
      if (email) updateData.email = email;

      const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(id, updateData)

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User updated successfully.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }


    if (!email || !password || !first_name || !last_name || !role) {
      throw new Error('Missing required fields.')
    }

    // 6. Create the User securely in Supabase Auth using the Master Key
    const { data: newAuthUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm so they don't have to click an email link
      user_metadata: {
        first_name,
        last_name,
        role,
        school_id: schoolId
      }
    })

    if (createError) {
      throw new Error(`Failed to create user auth: ${createError.message}`)
    }

    const newUserId = newAuthUser.user.id

    // 7. Return Success
    // Note: The upgraded database trigger automatically intercepted the user creation,
    // read the school_id and role from the metadata, and created the Profile automatically!
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${role} created successfully.`, 
        user: { id: newUserId, email, role } 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Edge Function Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
