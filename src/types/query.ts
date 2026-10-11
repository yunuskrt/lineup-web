import '@tanstack/react-query';

export type MutationMeta = {
  // Its 401 means wrong credentials, not a lost session
  isCredentialCheck?: boolean;
};

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: MutationMeta;
  }
}
