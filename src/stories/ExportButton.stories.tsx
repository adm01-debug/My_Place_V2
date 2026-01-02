import type { Meta, StoryObj } from '@storybook/react';
import { ExportButton } from '../components/portal/ExportButton';
const meta: Meta<typeof ExportButton> = { title: 'Portal/ExportButton', component: ExportButton, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { data: [{ a: 1 }], filename: 'export' } };
