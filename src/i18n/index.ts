// Configuração básica de i18n
// src/i18n/index.ts
// TODO: Implementar i18next quando necessário suporte multi-idioma

export const defaultLocale = 'pt-BR';

export const translations = {
  'pt-BR': {
    common: {
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Excluir',
      edit: 'Editar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
    },
    auth: {
      login: 'Entrar',
      logout: 'Sair',
      email: 'E-mail',
      password: 'Senha',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Olá',
      notifications: 'Notificações',
    },
    menu: {
      home: 'Início',
      profile: 'Meu Perfil',
      holerites: 'Holerites',
      ponto: 'Registro de Ponto',
      ferias: 'Férias',
      beneficios: 'Benefícios',
      treinamentos: 'Treinamentos',
      documentos: 'Documentos',
      kudos: 'Kudos',
      trilhas: 'Trilhas',
    },
  },
};

export function t(key: string, locale = defaultLocale): string {
  const keys = key.split('.');
  let value: any = translations[locale as keyof typeof translations];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export default { defaultLocale, translations, t };
