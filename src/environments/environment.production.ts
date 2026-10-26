export const environment = {
  production: true,
  api: {
    baseUrl: 'http://localhost:8080/rvd',
    securityAuthUrl: 'http://127.0.0.1:8171',
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
  recaptcha: {},
};
