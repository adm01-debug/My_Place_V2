import type { Meta, StoryObj } from '@storybook/react';
import { AvatarUpload } from '../components/portal/AvatarUpload';
const meta: Meta<typeof AvatarUpload> = { title: 'Portal/AvatarUpload', component: AvatarUpload, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
