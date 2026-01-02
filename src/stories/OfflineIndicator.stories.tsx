import type { Meta, StoryObj } from '@storybook/react';
import { OfflineIndicator } from '../components/portal/OfflineIndicator';
const meta: Meta<typeof OfflineIndicator> = { title: 'Portal/OfflineIndicator', component: OfflineIndicator, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
