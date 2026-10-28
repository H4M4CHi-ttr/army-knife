/** Public RFC 8037 vector with synthetic rotation metadata, never a private key. */
export const JWK_SAMPLE = JSON.stringify({ keys: [
  { kty: "OKP", crv: "Ed25519", x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo", kid: "rotation-a", alg: "EdDSA", use: "sig", key_ops: ["verify"] },
  { kty: "OKP", crv: "Ed25519", x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo", kid: "rotation-b", alg: "RS256" },
] }, null, 2);
