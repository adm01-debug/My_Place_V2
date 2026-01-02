import type { Meta, StoryObj } from '@storybook/react';
import { FeedbackDashboard } from '../components/portal/FeedbackDashboard';
const meta: Meta<typeof FeedbackDashboard> = { title: 'Portal/FeedbackDashboard', component: FeedbackDashboard, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
