import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check if caller is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData.role !== 'admin') {
      throw new Error('Forbidden: Admin access required')
    }

    // Admin-privileged client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userData, userId, role } = await req.json()

    if (action === 'createUser') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { nome: userData.nome }
      })
      if (error) throw error
      
      // Profile is usually created by trigger, but let's ensure it has the name
      await supabaseAdmin.from('profiles').update({ 
        nome: userData.nome,
        departamento: userData.departamento,
        cargo: userData.cargo,
        matricula: userData.matricula,
        cpf: userData.cpf
      }).eq('id', data.user.id)

      // Set role
      if (role) {
        await supabaseAdmin.from('user_roles').insert({ user_id: data.user.id, role })
      }

      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'updateUser') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: userData.email,
        user_metadata: { nome: userData.nome }
      })
      if (error) throw error

      await supabaseAdmin.from('profiles').update({ 
        nome: userData.nome,
        departamento: userData.departamento,
        cargo: userData.cargo,
        matricula: userData.matricula,
        cpf: userData.cpf
      }).eq('id', userId)

      if (role) {
        await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' })
      }

      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'deleteUser') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
