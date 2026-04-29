/**
 * Plantilla: copia a "config.js" en desarrollo local o usa las envs en Cloud Run.
 * NO commitear credenciales reales.
 */

window.aria_msal_config = {
  clientId: '<SOLICITAR_A_INFRA_M365_CLIENT_ID>',
  authority: 'https://login.microsoftonline.com/<TENANT_ID_AZURE_AD>',
};
