import type { Meta, StoryObj } from '@storybook/react';
import { KudosCard } from '../components/portal/KudosCard';

const meta: Meta<typeof KudosCard> = {
  title: 'Portal/KudosCard',
  component: KudosCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    kudo: {
      id: '1',
      mensagem: 'Excelente trabalho na entrega do projeto!',
      created_at: new Date().toISOString(),
      de_usuario: { id: '1', nome: 'Maria Silva', avatar_url: null, cargo: 'Gerente' },
      para_usuario: { id: '2', nome: 'João Santos', avatar_url: null, cargo: 'Dev' },
      categoria: { nome: 'Colaboração', icone: '🤝', cor: '#10b981', pontos: 10 },
      reacoes_count: 5,
    },
  },
};

export const WithoutCategory: Story = {
  args: {
    kudo: {
      id: '2',
      mensagem: 'Parabéns pelo resultado!',
      created_at: new Date().toISOString(),
      de_usuario: { id: '1', nome: 'Ana Costa', avatar_url: null, cargo: 'RH' },
      para_usuario: { id: '3', nome: 'Pedro Lima', avatar_url: null, cargo: 'Vendedor' },
    },
  },
};
