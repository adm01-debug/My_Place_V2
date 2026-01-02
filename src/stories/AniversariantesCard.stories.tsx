import type { Meta, StoryObj } from '@storybook/react';
import { AniversariantesCard } from '../components/portal/AniversariantesCard';
const meta: Meta<typeof AniversariantesCard> = { title: 'Portal/AniversariantesCard', component: AniversariantesCard, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
