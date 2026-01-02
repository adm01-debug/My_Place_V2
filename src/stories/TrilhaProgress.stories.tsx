import type { Meta, StoryObj } from '@storybook/react';
import { TrilhaProgress } from '../components/portal/TrilhaProgress';
const meta: Meta<typeof TrilhaProgress> = { title: 'Portal/TrilhaProgress', component: TrilhaProgress, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const InProgress: Story = { args: { nome: 'React Avançado', nivel: 'intermediario', etapas: [], etapasConcluidas: 5, progressoPercentual: 60, status: 'em_andamento' } };
export const Completed: Story = { args: { nome: 'TypeScript Básico', nivel: 'iniciante', etapas: [], etapasConcluidas: 10, progressoPercentual: 100, status: 'concluida' } };
