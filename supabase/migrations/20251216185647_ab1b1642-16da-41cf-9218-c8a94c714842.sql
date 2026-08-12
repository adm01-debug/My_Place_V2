-- Allow users to update parcelas of their own emprestimos
CREATE POLICY "Users can update parcelas of own emprestimos"
ON public.parcelas_emprestimo
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM emprestimos
  WHERE emprestimos.id = parcelas_emprestimo.emprestimo_id
  AND emprestimos.user_id = auth.uid()
));

-- Allow users to update their own emprestimos (for saldo_devedor, parcelas_pagas)
CREATE POLICY "Users can update own emprestimos"
ON public.emprestimos
FOR UPDATE
USING (auth.uid() = user_id);