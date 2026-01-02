import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from '../components/portal/SearchInput';

const meta: Meta<typeof SearchInput> = {
  title: 'Portal/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Buscar...',
    onSearch: (t) => console.log(t),
  },
};

export const WithValue: Story = {
  args: {
    placeholder: 'Buscar...',
    value: 'termo de busca',
    onSearch: (t) => console.log(t),
  },
};
