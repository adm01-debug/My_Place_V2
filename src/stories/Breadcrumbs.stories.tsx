import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from '../components/portal/Breadcrumbs';
const meta: Meta<typeof Breadcrumbs> = { title: 'Portal/Breadcrumbs', component: Breadcrumbs, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
