import type { Meta, StoryObj } from '@storybook/react';
import { KudosWidget } from '../components/portal/KudosWidget';
const meta: Meta<typeof KudosWidget> = { title: 'Portal/KudosWidget', component: KudosWidget, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
