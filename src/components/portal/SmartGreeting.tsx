import { useMemo } from 'react';

interface SmartGreetingProps {
  name?: string;
}

export function SmartGreeting({ name }: SmartGreetingProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const emoji = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
  }, []);

  return (
    <h2 className="text-lg font-semibold text-foreground">
      {greeting}, {name || 'Colaborador'}! {emoji}
    </h2>
  );
}
