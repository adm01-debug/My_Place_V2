import type { Meta, StoryObj } from '@storybook/react';
import { StatCardSkeleton, ListItemSkeleton, TableSkeleton, ProfileSkeleton } from '../components/portal/Skeletons';

const meta: Meta<typeof StatCardSkeleton> = { 
  title: 'Portal/Skeletons', 
  component: StatCardSkeleton, 
  tags: ['autodocs'] 
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = { render: () => <StatCardSkeleton /> };
export const List: Story = { render: () => <ListItemSkeleton /> };
export const Table: Story = { render: () => <TableSkeleton rows={5} /> };
export const Profile: Story = { render: () => <ProfileSkeleton /> };
