import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../components/portal/EmptyState';
import { FileText, Search } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Portal/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const NoData: Story = {
  args: {
    icon: FileText,
    title: 'Nenhum documento',
    description: 'Você ainda não possui documentos.',
  },
};

export const NoResults: Story = {
  args: {
    icon: Search,
    title: 'Nenhum resultado',
    description: 'Tente ajustar os filtros.',
    action: {
      label: 'Limpar filtros',
      onClick: () => console.log('clear'),
    },
  },
};