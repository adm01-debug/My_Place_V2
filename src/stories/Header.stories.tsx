import type { Meta, StoryObj } from '@storybook/react';
import { Header } from '../components/portal/Header';

const meta: Meta<typeof Header> = {
  title: 'Portal/Header',
  component: Header,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Dashboard',
  },
};

export const WithBackButton: Story = {
  args: {
    title: 'Holerites',
    showBack: true,
  },
};