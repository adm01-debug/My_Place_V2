
-- Item 45: Sistema de Templates de Notificação (versionamento + variáveis + multi-canal)

CREATE TABLE IF NOT EXISTS public.notificacao_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'in_app' CHECK (canal IN ('in_app','push','email','sms','whatsapp')),
  idioma TEXT NOT NULL DEFAULT 'pt-BR',
  versao INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  titulo_template TEXT NOT NULL,
  mensagem_template TEXT NOT NULL,
  variaveis_esperadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  descricao TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (codigo, canal, idioma, versao)
);

CREATE INDEX IF NOT EXISTS idx_notif_tpl_lookup
  ON public.notificacao_templates (codigo, canal, idioma, ativo);

GRANT SELECT ON public.notificacao_templates TO authenticated;
GRANT ALL ON public.notificacao_templates TO service_role;

ALTER TABLE public.notificacao_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ler templates ativos"
  ON public.notificacao_templates FOR SELECT TO authenticated
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam templates"
  ON public.notificacao_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_notif_tpl_updated
  BEFORE UPDATE ON public.notificacao_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Renderização segura de templates (escape básico, limite 200 vars)
CREATE OR REPLACE FUNCTION public.fn_render_template(
  _template TEXT,
  _vars JSONB
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _result TEXT := COALESCE(_template, '');
  _key TEXT;
  _val TEXT;
  _count INT := 0;
BEGIN
  IF _vars IS NULL OR jsonb_typeof(_vars) <> 'object' THEN
    RETURN _result;
  END IF;

  FOR _key, _val IN SELECT k, COALESCE(v #>> '{}', '') FROM jsonb_each(_vars) AS t(k, v) LOOP
    EXIT WHEN _count >= 200;
    -- Escape mínimo para prevenir HTML injection em canais web
    _val := replace(replace(replace(_val, '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
    _result := replace(_result, '{{' || _key || '}}', _val);
    _count := _count + 1;
  END LOOP;

  RETURN _result;
END;
$$;

-- Busca template ativo mais recente por código+canal+idioma (fallback: pt-BR)
CREATE OR REPLACE FUNCTION public.fn_get_template(
  _codigo TEXT,
  _canal TEXT DEFAULT 'in_app',
  _idioma TEXT DEFAULT 'pt-BR'
) RETURNS public.notificacao_templates
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.notificacao_templates
  WHERE codigo = _codigo AND canal = _canal AND ativo = true
    AND idioma IN (_idioma, 'pt-BR')
  ORDER BY (idioma = _idioma) DESC, versao DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.fn_render_template(TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_get_template(TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Seed de templates iniciais para categorias já usadas
INSERT INTO public.notificacao_templates (codigo, categoria, canal, titulo_template, mensagem_template, variaveis_esperadas, descricao)
VALUES
  ('vale_aprovado', 'financeiro', 'in_app', 'Vale aprovado ✅',
   'Olá {{nome}}, seu vale de R$ {{valor}} foi aprovado e será processado em {{data}}.',
   '["nome","valor","data"]'::jsonb, 'Notificação padrão de aprovação de vale'),
  ('vale_reprovado', 'financeiro', 'in_app', 'Vale não aprovado',
   'Olá {{nome}}, seu vale foi reprovado. Motivo: {{motivo}}.',
   '["nome","motivo"]'::jsonb, 'Notificação de reprovação de vale'),
  ('ferias_aprovadas', 'rh', 'in_app', 'Férias aprovadas 🏖️',
   'Suas férias de {{inicio}} a {{fim}} foram aprovadas!',
   '["inicio","fim"]'::jsonb, 'Aprovação de férias'),
  ('ponto_ausente', 'ponto', 'in_app', 'Batida de ponto pendente',
   'Você ainda não registrou {{tipo}} hoje. Não esqueça!',
   '["tipo"]'::jsonb, 'Lembrete de batida de ponto'),
  ('documento_novo', 'documentos', 'in_app', 'Novo documento disponível 📄',
   'O documento "{{titulo}}" foi disponibilizado para você.',
   '["titulo"]'::jsonb, 'Novo documento publicado')
ON CONFLICT (codigo, canal, idioma, versao) DO NOTHING;
