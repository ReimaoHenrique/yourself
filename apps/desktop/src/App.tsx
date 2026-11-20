import { NavLink } from "react-router-dom";
import { AppRoutes, routes } from "./app/routes";
import "./App.css";

const NAV = [
  { to: routes.home, label: "Início", end: true },
  { to: routes.tasks, label: "Tarefas", end: false },
  { to: routes.profile, label: "Perfil", end: false },
  { to: routes.meetings, label: "Reuniões", end: false },
  { to: routes.about, label: "Arquitetura", end: false },
];

/**
 * Shell da aplicação (View raiz): cabeçalho com navegação + `<Outlet />`
 * onde o componente de rotas renderiza a View correspondente.
 */
function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">yourself (Desktop)</span>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
