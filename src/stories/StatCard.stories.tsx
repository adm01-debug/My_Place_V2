import type { Meta, StoryObj } from '@storybook/react';
import { DollarSign, Clock, Umbrella } from 'lucide-react';
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
    label: 'Salário Líquido',
    value: 'R$ 5.432,10',
    icon: DollarSign,
    subValue: '+2.5%',
  },
};

export const HorasExtras: Story = {
  args: {
    label: 'Horas Extras',
    value: '12h',
    icon: Clock,
    subValue: '-5%',
  },
};

export const Ferias: Story = {
  args: {
    label: 'Dias de Férias',
    value: '15 dias',
    icon: Umbrella,
  },
};