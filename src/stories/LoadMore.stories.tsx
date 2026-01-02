import type { Meta, StoryObj } from '@storybook/react';
import { LoadMore } from '../components/portal/LoadMore';
const meta: Meta<typeof LoadMore> = { title: 'Portal/LoadMore', component: LoadMore, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
