import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '../components/portal/Skeleton';
const meta: Meta<typeof Skeleton> = { title: 'Portal/Skeleton', component: Skeleton, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
