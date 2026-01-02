import type { Meta, StoryObj } from '@storybook/react';
import { AlertCard } from '../components/portal/AlertCard';
const meta: Meta<typeof AlertCard> = { title: 'Portal/AlertCard', component: AlertCard, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Info: Story = { args: { type: 'info', title: 'Informação', message: 'Mensagem informativa' } };
export const Warning: Story = { args: { type: 'warning', title: 'Atenção', message: 'Ação requer atenção' } };
