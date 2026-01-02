import type { Meta, StoryObj } from '@storybook/react';
import { GlobalSearch } from '../components/portal/GlobalSearch';
const meta: Meta<typeof GlobalSearch> = { title: 'Portal/GlobalSearch', component: GlobalSearch, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
