import type { Meta, StoryObj } from '@storybook/react';
import { CertificadoCard } from '../components/portal/CertificadoCard';

const meta: Meta<typeof CertificadoCard> = { 
  title: 'Portal/CertificadoCard', 
  component: CertificadoCard, 
  tags: ['autodocs'] 
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { 
  args: { 
    certificado: { 
      id: '1', 
      titulo: 'React Certified',
      tipo: 'curso',
      dataEmissao: '2025-01-01',
    } 
  } 
};