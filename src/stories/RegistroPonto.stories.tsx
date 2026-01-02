import type { Meta, StoryObj } from '@storybook/react';
import { RegistroPonto } from '../components/portal/RegistroPonto';
const meta: Meta<typeof RegistroPonto> = { title: 'Portal/RegistroPonto', component: RegistroPonto, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
