import { Route, Routes } from "react-router-dom";
import { AboutView } from "../views/about/AboutView";
import { HomeView } from "../views/home/HomeView";
import { NotFoundView } from "../views/not-found/NotFoundView";
import { TasksView } from "../views/tasks/TasksView";
import { UsageView } from "../views/usage/UsageView";
import { ProfileView } from "../views/profile/ProfileView";
import { MeetingsView } from "../views/meetings/MeetingsView";
import { routes } from "./paths";

/**
 * Componente de rotas — equivalente ao `app.routes.ts` do Angular.
 *
 * Toda navegação passa por aqui; as Views não conhecem umas às outras.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={routes.home} element={<HomeView />} />
      <Route path={routes.tasks} element={<TasksView />} />
      <Route path={routes.usage} element={<UsageView />} />
      <Route path={routes.profile} element={<ProfileView />} />
      <Route path={routes.meetings} element={<MeetingsView />} />
      <Route path={routes.about} element={<AboutView />} />
      <Route path="*" element={<NotFoundView />} />
    </Routes>
  );
}
