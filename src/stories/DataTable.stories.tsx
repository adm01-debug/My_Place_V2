import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '../components/portal/DataTable';

const meta: Meta<typeof DataTable> = {
  title: 'Portal/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
    ],
    data: [
      { id: 1, nome: 'João Silva', email: 'joao@email.com', status: 'Ativo' },
      { id: 2, nome: 'Maria Santos', email: 'maria@email.com', status: 'Inativo' },
    ],
  },
};
