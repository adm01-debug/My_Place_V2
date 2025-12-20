import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuração Bitrix24 - Definir via variáveis de ambiente
const BITRIX_WEBHOOK = Deno.env.get('BITRIX_WEBHOOK_URL') || ''
const BITRIX_USER_ID = Deno.env.get('BITRIX_USER_ID') || '1'

interface BitrixContact {
  ID?: string
  NAME: string
  LAST_NAME: string
  EMAIL: Array<{ VALUE: string; VALUE_TYPE: string }>
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>
  POST?: string
  COMMENTS?: string
  UF_CRM_DEPARTAMENTO?: string
  UF_CRM_MATRICULA?: string
  UF_CRM_DATA_ADMISSAO?: string
}

async function callBitrix(method: string, params: Record<string, any> = {}) {
  if (!BITRIX_WEBHOOK) {
    throw new Error('BITRIX_WEBHOOK_URL não configurado')
  }
  
  const url = `${BITRIX_WEBHOOK}${method}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  
  if (!response.ok) {
    throw new Error(`Bitrix API error: ${response.status}`)
  }
  
  const data = await response.json()
  if (data.error) {
    throw new Error(`Bitrix error: ${data.error_description || data.error}`)
  }
  
  return data.result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, data } = await req.json()

    switch (action) {
      // =====================================================
      // SINCRONIZAR COLABORADOR → BITRIX24
      // =====================================================
      case 'sync-colaborador': {
        const { user_id } = data
        
        // Buscar dados do colaborador
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user_id)
          .single()
        
        if (error || !profile) {
          throw new Error('Colaborador não encontrado')
        }
        
        const [nome, ...sobrenome] = (profile.nome_completo || '').split(' ')
        
        const contactData: BitrixContact = {
          NAME: nome || 'Colaborador',
          LAST_NAME: sobrenome.join(' ') || '',
          EMAIL: [{ VALUE: profile.email || '', VALUE_TYPE: 'WORK' }],
          PHONE: profile.telefone ? [{ VALUE: profile.telefone, VALUE_TYPE: 'WORK' }] : undefined,
          POST: profile.cargo || '',
          UF_CRM_DEPARTAMENTO: profile.departamento || '',
          UF_CRM_MATRICULA: profile.matricula || '',
          UF_CRM_DATA_ADMISSAO: profile.data_admissao || '',
        }
        
        // Verificar se já existe no Bitrix
        const existing = await callBitrix('crm.contact.list', {
          filter: { EMAIL: profile.email },
          select: ['ID']
        })
        
        let bitrixId: string
        
        if (existing && existing.length > 0) {
          // Atualizar
          bitrixId = existing[0].ID
          await callBitrix('crm.contact.update', {
            id: bitrixId,
            fields: contactData
          })
        } else {
          // Criar novo
          bitrixId = await callBitrix('crm.contact.add', { fields: contactData })
        }
        
        // Salvar ID do Bitrix no profile
        await supabase
          .from('profiles')
          .update({ bitrix_id: bitrixId })
          .eq('id', user_id)
        
        return new Response(
          JSON.stringify({ success: true, bitrix_id: bitrixId, action: existing?.length ? 'updated' : 'created' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // =====================================================
      // CRIAR TAREFA DE FÉRIAS NO BITRIX24
      // =====================================================
      case 'criar-tarefa-ferias': {
        const { ferias_id, user_id, data_inicio, data_fim, dias, tipo } = data
        
        // Buscar dados do colaborador
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome_completo, cargo, departamento')
          .eq('id', user_id)
          .single()
        
        // Criar tarefa no Bitrix24
        const taskData = {
          TITLE: `🏖️ Férias - ${profile?.nome_completo || 'Colaborador'}`,
          DESCRIPTION: `
            **Solicitação de Férias**
            
            Colaborador: ${profile?.nome_completo}
            Cargo: ${profile?.cargo || '-'}
            Departamento: ${profile?.departamento || '-'}
            
            Período: ${data_inicio} a ${data_fim}
            Dias: ${dias}
            Tipo: ${tipo === 'integral' ? 'Férias Integrais' : 'Férias Parciais'}
            
            ID Supabase: ${ferias_id}
          `,
          RESPONSIBLE_ID: BITRIX_USER_ID, // Responsável (RH)
          DEADLINE: data_inicio,
          START_DATE_PLAN: data_inicio,
          END_DATE_PLAN: data_fim,
          PRIORITY: '1', // Normal
          TAGS: ['ferias', 'rh', 'portal'],
          GROUP_ID: Deno.env.get('BITRIX_RH_GROUP_ID') || undefined,
        }
        
        const taskId = await callBitrix('tasks.task.add', { fields: taskData })
        
        // Salvar ID da tarefa na tabela ferias
        await supabase
          .from('ferias')
          .update({ bitrix_task_id: taskId.task?.id || taskId })
          .eq('id', ferias_id)
        
        return new Response(
          JSON.stringify({ success: true, task_id: taskId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // =====================================================
      // ENVIAR NOTIFICAÇÃO VIA BITRIX24
      // =====================================================
      case 'enviar-notificacao': {
        const { user_id, titulo, mensagem, tipo } = data
        
        // Buscar bitrix_id do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('bitrix_id')
          .eq('id', user_id)
          .single()
        
        if (!profile?.bitrix_id) {
          throw new Error('Colaborador não vinculado ao Bitrix24')
        }
        
        // Enviar notificação via IM
        await callBitrix('im.notify.personal.add', {
          USER_ID: profile.bitrix_id,
          MESSAGE: `[b]${titulo}[/b]\n\n${mensagem}`,
          MESSAGE_TYPE: tipo === 'importante' ? 'CONFIRM' : 'DEFAULT',
        })
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // =====================================================
      // LISTAR COLABORADORES DO BITRIX24
      // =====================================================
      case 'listar-colaboradores': {
        const contacts = await callBitrix('crm.contact.list', {
          filter: { 'UF_CRM_MATRICULA': { '!': '' } },
          select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'POST', 'UF_CRM_DEPARTAMENTO', 'UF_CRM_MATRICULA']
        })
        
        return new Response(
          JSON.stringify({ success: true, data: contacts }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (err) {
    const error = err as Error;
    console.error('Erro na integração Bitrix24:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
