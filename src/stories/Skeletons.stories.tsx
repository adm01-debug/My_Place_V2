import type { Meta, StoryObj } from '@storybook/react';
import { Skeletons } from '../components/portal/Skeletons';
const meta: Meta<typeof Skeletons> = { title: 'Portal/Skeletons', component: Skeletons, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
