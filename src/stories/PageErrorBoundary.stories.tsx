import type { Meta, StoryObj } from '@storybook/react';
import { PageErrorBoundary } from '../components/portal/PageErrorBoundary';
const meta: Meta<typeof PageErrorBoundary> = { title: 'Portal/PageErrorBoundary', component: PageErrorBoundary, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
