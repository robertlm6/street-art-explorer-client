export const environment = {
  production: false,

  authIssuer: 'http://localhost:9000',
  authClientId: 'public-client',
  authRedirectUri: window.location.origin + '/callback',

  resourceApi: 'http://localhost:9090',
  markersEndpoint: '/markers',

  mapboxToken: 'pk.eyJ1Ijoicm9iZXJ0b2xtIiwiYSI6ImNtZWd4aWVxbzAxcWsya3BkMXhidjZxMTAifQ.Ou_bpkTLZvFlwaVsrxRFWw',

  cloudinaryCloudName: 'dzc1qzfe1',
  cloudinaryUploadPreset: 'sae_unsigned_preset'
};
