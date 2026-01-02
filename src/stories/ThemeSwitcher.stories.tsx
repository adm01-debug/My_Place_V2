import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSwitcher } from '../components/portal/ThemeSwitcher';
const meta: Meta<typeof ThemeSwitcher> = { title: 'Portal/ThemeSwitcher', component: ThemeSwitcher, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
