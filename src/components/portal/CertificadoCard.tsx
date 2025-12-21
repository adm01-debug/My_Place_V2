import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2, ExternalLink, Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CertificadoData {
  id: string;
  titulo: string;
  tipo: 'trilha' | 'treinamento' | 'curso' | 'certificacao';
  descricao?: string;
  emissor?: string;
  dataEmissao: string;
  dataValidade?: string;
  cargaHoraria?: number;
  nivel?: string;
  urlVerificacao?: string;
  urlDownload?: string;
}

interface CertificadoCardProps {
  certificado: CertificadoData;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
  onVerificar?: (id: string) => void;
  compact?: boolean;
  className?: string;
}

const getTipoConfig = (tipo: string) => {
  const config: Record<string, { label: string; icon: string; color: string }> = {
    trilha: { label: 'Trilha', icon: '🛤️', color: 'bg-blue-100 text-blue-800' },
    treinamento: { label: 'Treinamento', icon: '🎓', color: 'bg-green-100 text-green-800' },
    curso: { label: 'Curso', icon: '📚', color: 'bg-purple-100 text-purple-800' },
    certificacao: { label: 'Certificação', icon: '🏅', color: 'bg-yellow-100 text-yellow-800' },
  };
  return config[tipo] || { label: tipo, icon: '📜', color: 'bg-gray-100 text-gray-800' };
};

export const CertificadoCard: React.FC<CertificadoCardProps> = ({
  certificado,
  onDownload,
  onShare,
  onVerificar,
  compact = false,
  className,
}) => {
  const tipoConfig = getTipoConfig(certificado.tipo);
  const isValido = !certificado.dataValidade || new Date(certificado.dataValidade) > new Date();

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn(
          'p-4 rounded-lg border flex items-center gap-4 cursor-pointer transition-shadow hover:shadow-md',
          !isValido && 'opacity-60',
          className
        )}
        onClick={() => onDownload?.(certificado.id)}
      >
        <div className="text-3xl">{tipoConfig.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{certificado.titulo}</h4>
          <p className="text-xs text-muted-foreground">
            {format(new Date(certificado.dataEmissao), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        {!isValido && <Badge variant="destructive">Expirado</Badge>}
        <Download className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn(
        'overflow-hidden',
        !isValido && 'opacity-70',
        className
      )}>
        {/* Certificate Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center border-b">
          <div className="text-5xl mb-3">{tipoConfig.icon}</div>
          <Award className="h-8 w-8 mx-auto text-primary mb-2" />
          <h3 className="font-bold text-lg">{certificado.titulo}</h3>
          {certificado.emissor && (
            <p className="text-sm text-muted-foreground">{certificado.emissor}</p>
          )}
        </div>

        <CardContent className="pt-4">
          {certificado.descricao && (
            <p className="text-sm text-muted-foreground mb-4">{certificado.descricao}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Emitido em</p>
                <p className="font-medium">
                  {format(new Date(certificado.dataEmissao), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {certificado.cargaHoraria && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Carga Horária</p>
                  <p className="font-medium">{certificado.cargaHoraria}h</p>
                </div>
              </div>
            )}

            {certificado.dataValidade && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Válido até</p>
                  <p className={cn('font-medium', !isValido && 'text-destructive')}>
                    {format(new Date(certificado.dataValidade), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {certificado.nivel && (
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nível</p>
                  <p className="font-medium capitalize">{certificado.nivel}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Badge className={tipoConfig.color}>{tipoConfig.label}</Badge>
            {!isValido && <Badge variant="destructive">Expirado</Badge>}
          </div>
        </CardContent>

        <CardFooter className="border-t bg-muted/30 gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => onDownload?.(certificado.id)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onShare?.(certificado.id)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {certificado.urlVerificacao && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onVerificar?.(certificado.id)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default CertificadoCard;
