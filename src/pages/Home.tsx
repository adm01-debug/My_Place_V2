import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';

export default function Home() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <Avatar className="w-20 h-20 mx-auto">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {profile?.nome || 'Colaborador'}!
          </h1>
          <p className="text-muted-foreground mt-1">{profile?.email || user?.email}</p>
          {profile?.cargo && (
            <p className="text-sm text-muted-foreground">{profile.cargo} • {profile.departamento}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={() => navigate('/perfil')} className="w-full">
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
          <Button variant="destructive" onClick={signOut} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </Card>
    </div>
  );
}
