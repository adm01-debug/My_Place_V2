import type { Meta, StoryObj } from '@storybook/react';
import { PushNotificationSettings } from '../components/portal/PushNotificationSettings';
const meta: Meta<typeof PushNotificationSettings> = { title: 'Portal/PushNotificationSettings', component: PushNotificationSettings, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
