import type { Meta, StoryObj } from '@storybook/react';
import { DashboardCharts } from '../components/portal/DashboardCharts';
const meta: Meta<typeof DashboardCharts> = { title: 'Portal/DashboardCharts', component: DashboardCharts, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
