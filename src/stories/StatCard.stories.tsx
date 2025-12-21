import type { Meta, StoryObj } from '@storybook/react';
import { DollarSign, Clock, Umbrella, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/portal/StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Portal/StatCard',
  component: StatCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Salário Líquido',
    value: 'R$ 5.432,10',
    icon: DollarSign,
    trend: '+2.5%',
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Horas Extras',
    value: '12h',
    icon: Clock,
    trend: '-5%',
  },
};

export const Vacation: Story = {
  args: {
    title: 'Dias de Férias',
    value: '15 dias',
    icon: Umbrella,
  },
};
