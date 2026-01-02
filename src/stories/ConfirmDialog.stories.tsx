import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmDialog } from '../components/portal/ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Portal/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Confirmar exclusão',
    description: 'Tem certeza que deseja excluir este item?',
    onConfirm: () => console.log('confirmed'),
    onCancel: () => console.log('cancelled'),
  },
};

export const Destructive: Story = {
  args: {
    open: true,
    title: 'Excluir permanentemente',
    description: 'Esta ação não pode ser desfeita.',
    confirmText: 'Excluir',
    variant: 'destructive',
    onConfirm: () => console.log('deleted'),
    onCancel: () => console.log('cancelled'),
  },
};
