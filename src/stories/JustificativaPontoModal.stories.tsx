import type { Meta, StoryObj } from '@storybook/react';
import { JustificativaPontoModal } from '../components/portal/JustificativaPontoModal';
const meta: Meta<typeof JustificativaPontoModal> = { title: 'Portal/JustificativaPontoModal', component: JustificativaPontoModal, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: {} };
