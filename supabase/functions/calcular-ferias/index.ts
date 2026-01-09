const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculoFeriasRequest {
  salarioBruto: number;
  diasFerias: number;
  abonoSolicitar?: boolean;
  diasAbono?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { salarioBruto, diasFerias, abonoSolicitar = false, diasAbono = 0 } = await req.json();

    if (!salarioBruto || diasFerias < 5 || diasFerias > 30) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const salarioDia = salarioBruto / 30;
    const diasEfetivos = abonoSolicitar ? diasFerias - diasAbono : diasFerias;
    
    const valorFerias = salarioDia * diasEfetivos;
    const tercoConstitucional = valorFerias / 3;
    const totalFerias = valorFerias + tercoConstitucional;

    const valorAbono = abonoSolicitar ? salarioDia * diasAbono : 0;
    const tercoAbono = valorAbono / 3;
    const totalAbono = valorAbono + tercoAbono;

    const totalBruto = totalFerias + totalAbono;
    const inss = calcularINSS(totalFerias);
    const irrf = calcularIRRF(totalFerias - inss);
    const totalLiquido = totalBruto - inss - irrf;

    return new Response(JSON.stringify({
      valorFerias: arredondar(valorFerias),
      tercoConstitucional: arredondar(tercoConstitucional),
      totalFerias: arredondar(totalFerias),
      valorAbono: arredondar(valorAbono),
      tercoAbono: arredondar(tercoAbono),
      totalAbono: arredondar(totalAbono),
      inss: arredondar(inss),
      irrf: arredondar(irrf),
      totalBruto: arredondar(totalBruto),
      totalLiquido: arredondar(totalLiquido),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calcularINSS(base: number): number {
  if (base <= 1412) return base * 0.075;
  if (base <= 2666.68) return base * 0.09 - 21.18;
  if (base <= 4000.03) return base * 0.12 - 101.18;
  if (base <= 7786.02) return base * 0.14 - 181.18;
  return 908.86;
}

function calcularIRRF(base: number): number {
  if (base <= 2259.20) return 0;
  if (base <= 2826.65) return base * 0.075 - 169.44;
  if (base <= 3751.05) return base * 0.15 - 381.44;
  if (base <= 4664.68) return base * 0.225 - 662.77;
  return base * 0.275 - 896.00;
}

function arredondar(v: number): number { return Math.round(v * 100) / 100; }
