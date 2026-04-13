export const tipoOptions = [
  { value: 'vendas', label: 'Vendas', cor: 'text-finance' },
  { value: 'produtividade', label: 'Produtividade', cor: 'text-primary' },
  { value: 'desenvolvimento', label: 'Desenvolvimento', cor: 'text-hr' },
  { value: 'qualidade', label: 'Qualidade', cor: 'text-projects' },
  { value: 'outro', label: 'Outro', cor: 'text-muted-foreground' },
];

export const statusColors: Record<string, string> = {
  em_andamento: 'bg-blue-500',
  concluida: 'bg-green-500',
  cancelada: 'bg-gray-500',
  pausada: 'bg-yellow-500',
};

export const statusLabels: Record<string, string> = {
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  pausada: 'Pausada',
};
