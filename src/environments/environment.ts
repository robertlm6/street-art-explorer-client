export const environment = {
  production: false,

  authIssuer: 'http://localhost:9000',
  authClientId: 'public-client',
  authRedirectUri: window.location.origin + '/callback',

  resourceApi: 'http://localhost:9090',

  mapboxToken: 'pk.eyJ1Ijoicm9iZXJ0b2xtIiwiYSI6ImNtMHp2OWw3ZzA5ajAycnNjcHlnajN6bHEifQ.zJyHiJlflKurW6IC-bel3A',

  cloudinaryCloudName: 'dzc1qzfe1',
  cloudinaryUploadPreset: 'sae_unsigned_preset'
};
