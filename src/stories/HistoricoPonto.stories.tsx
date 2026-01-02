import type { Meta, StoryObj } from '@storybook/react';
import { HistoricoPonto } from '../components/portal/HistoricoPonto';
const meta: Meta<typeof HistoricoPonto> = { title: 'Portal/HistoricoPonto', component: HistoricoPonto, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
