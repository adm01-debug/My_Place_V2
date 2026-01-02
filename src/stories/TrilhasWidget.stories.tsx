import type { Meta, StoryObj } from '@storybook/react';
import { TrilhasWidget } from '../components/portal/TrilhasWidget';
const meta: Meta<typeof TrilhasWidget> = { title: 'Portal/TrilhasWidget', component: TrilhasWidget, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
