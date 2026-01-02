import type { Meta, StoryObj } from '@storybook/react';
import { AssistenteVirtual } from '../components/portal/AssistenteVirtual';
const meta: Meta<typeof AssistenteVirtual> = { title: 'Portal/AssistenteVirtual', component: AssistenteVirtual, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
