import type { Meta, StoryObj } from '@storybook/react';
import { DateRangePicker } from '../components/portal/DateRangePicker';
const meta: Meta<typeof DateRangePicker> = { title: 'Portal/DateRangePicker', component: DateRangePicker, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { onChange: (r) => console.log(r) } };
