import type { Meta, StoryObj } from '@storybook/react';
import SearchInput from '../components/portal/SearchInput';

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
    value: '',
    onChange: (t) => console.log(t),
  },
};
