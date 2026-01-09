import type { Meta, StoryObj } from '@storybook/react';
import { SalaryEvolutionChart, HoursDistributionChart, GoalProgressChart } from '../components/portal/DashboardCharts';

const meta: Meta<typeof SalaryEvolutionChart> = { 
  title: 'Portal/DashboardCharts', 
  component: SalaryEvolutionChart, 
  tags: ['autodocs'] 
};
export default meta;
type Story = StoryObj<typeof meta>;

export const SalaryChart: Story = {
  render: () => <SalaryEvolutionChart />
};

export const HoursChart: Story = {
  render: () => <HoursDistributionChart />
};

export const GoalChart: Story = {
  render: () => <GoalProgressChart />
};