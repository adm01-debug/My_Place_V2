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
    onFilterChange: (f) => console.log(f),
  },
};