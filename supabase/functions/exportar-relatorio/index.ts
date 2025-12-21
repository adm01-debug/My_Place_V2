import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'ferias' | 'ponto' | 'holerites' | 'emprestimos' | 'treinamentos';
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ExportRequest = await req.json();
    const { type, format, filters = {} } = body;

    // Build query based on type
    let query;
    let filename = `relatorio_${type}_${new Date().toISOString().split('T')[0]}`;

    switch (type) {
      case 'ferias':
        query = supabase.from('ferias').select('*').eq('user_id', user.id);
        if (filters.status) query = query.eq('status', filters.status);
        break;
      case 'ponto':
        query = supabase.from('registros_ponto').select('*').eq('user_id', user.id);
        if (filters.startDate) query = query.gte('data_hora', filters.startDate);
        if (filters.endDate) query = query.lte('data_hora', filters.endDate);
        break;
      case 'holerites':
        query = supabase.from('holerites').select('*').eq('user_id', user.id);
        break;
      case 'emprestimos':
        query = supabase.from('emprestimos').select('*, parcelas_emprestimo(*)').eq('user_id', user.id);
        break;
      case 'treinamentos':
        query = supabase.from('treinamentos_colaborador').select('*, treinamento:treinamentos(*)').eq('user_id', user.id);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { data, error } = await query;
    if (error) throw error;

    // Generate export based on format
    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'csv':
        content = generateCSV(data);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'xlsx':
        // For XLSX, we'd need a library like SheetJS
        // For now, return CSV with xlsx extension hint
        content = generateCSV(data);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'pdf':
        // PDF would require a PDF library
        // Return JSON for now
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
    }

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).includes(',') ? `"${value}"` : value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
