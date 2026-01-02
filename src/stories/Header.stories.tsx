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

export const WithSubtitle: Story = {
  args: {
    title: 'Holerites',
    subtitle: 'Dezembro 2025',
  },
};
