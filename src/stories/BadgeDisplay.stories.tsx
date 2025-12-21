import type { Meta, StoryObj } from '@storybook/react';
import { BadgeDisplay } from '../components/portal/BadgeDisplay';

const meta: Meta<typeof BadgeDisplay> = {
  title: 'Portal/BadgeDisplay',
  component: BadgeDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Conquistado: Story = {
  args: {
    badge: { id: '1', nome: 'Primeiros Passos', descricao: 'Primeiro kudo', icone: '🌟', cor: '#f59e0b' },
    conquistado: true,
    dataConquista: new Date().toISOString(),
  },
};

export const Bloqueado: Story = {
  args: {
    badge: { id: '2', nome: 'Estrela', descricao: '100 kudos', icone: '⭐', cor: '#eab308', pontos_necessarios: 100 },
    conquistado: false,
  },
};
