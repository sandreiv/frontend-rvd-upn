export const environment = {
  production: false,
  api: {
    baseUrl: 'http://localhost:8080/rvd',
    securityAuthUrl: '/security-auth',
  },
  auth: {
    applicationId: 55100,
    tokenStorageKey: 'rvd.auth.token',
    userStorageKey: 'rvd.auth.user',
    loginRedirectUrl: '/rvd',
    logoutRedirectUrl: '',
    sessionRequiredUrl: '/sesion-requerida',
  },
  sidebarTheme: {
    color: '#00482B',
  },
  careerProfessor: {
    maxActivityHours: 40,
  },
};
