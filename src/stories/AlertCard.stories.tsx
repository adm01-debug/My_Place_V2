import type { Meta, StoryObj } from '@storybook/react';
import { AlertCard } from '../components/portal/AlertCard';

const meta: Meta<typeof AlertCard> = { 
  title: 'Portal/AlertCard', 
  component: AlertCard, 
  tags: ['autodocs'] 
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { 
  args: { 
    alerta: { 
      id: '1', 
      titulo: 'Informação', 
      descricao: 'Mensagem informativa',
      tipo: 'info',
    } 
  } 
};

export const Warning: Story = { 
  args: { 
    alerta: { 
      id: '2', 
      titulo: 'Atenção', 
      descricao: 'Ação requer atenção',
      tipo: 'warning',
    } 
  } 
};