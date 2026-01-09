import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from '../components/portal/DateRangePicker';

const meta: Meta<typeof DatePicker> = { 
  title: 'Portal/DatePicker', 
  component: DatePicker, 
  tags: ['autodocs'] 
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { 
  args: { 
    onChange: (date) => console.log(date) 
  } 
};