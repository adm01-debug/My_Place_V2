import type { Meta, StoryObj } from '@storybook/react';
import { NotificationsPanel } from '../components/portal/NotificationsPanel';
const meta: Meta<typeof NotificationsPanel> = { title: 'Portal/NotificationsPanel', component: NotificationsPanel, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
