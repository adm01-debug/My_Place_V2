import type { Meta, StoryObj } from '@storybook/react';
import { FilterBar } from '../components/portal/FilterBar';

const meta: Meta<typeof FilterBar> = {
  title: 'Portal/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filters: [
      { key: 'status', label: 'Status', options: ['Ativo', 'Inativo'] },
      { key: 'tipo', label: 'Tipo', options: ['A', 'B', 'C'] },
    ],
    onFilterChange: (f) => console.log(f),
  },
};
