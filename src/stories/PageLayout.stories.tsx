import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from '../components/portal/PageLayout';
const meta: Meta<typeof PageLayout> = { title: 'Portal/PageLayout', component: PageLayout, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
