import type { Meta, StoryObj } from '@storybook/react';
import { BottomNav } from '../components/portal/BottomNav';
const meta: Meta<typeof BottomNav> = { title: 'Portal/BottomNav', component: BottomNav, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
