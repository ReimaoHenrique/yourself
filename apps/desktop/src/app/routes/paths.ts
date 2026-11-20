/**
 * Mapa central de rotas. Views e links importam daqui — nunca escrevem
 * caminhos "cru" em string, igual ao padrão `paths.ts` de apps Angular.
 */
export const routes = {
  home: "/",
  tasks: "/tasks",
  profile: "/profile",
  meetings: "/meetings",
  about: "/about",
} as const;

export type RouteKey = keyof typeof routes;
