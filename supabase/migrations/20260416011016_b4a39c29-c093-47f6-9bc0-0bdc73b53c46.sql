
DROP POLICY "System can insert notifications" ON public.notificacoes;

CREATE POLICY "Users can receive notifications"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
