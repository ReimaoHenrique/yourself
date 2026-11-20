import { Link } from "react-router-dom";
import { useSystemController } from "../../controllers";
import { routes } from "../../routes";
import "./HomeView.css";

/** View — só renderiza o que o Controller devolve. Sem `invoke`, sem regra. */
export function HomeView() {
  const { info, error } = useSystemController();

  return (
    <section className="view home-view">
      <h1>yourself</h1>
      <p className="lead">
        Tauri 2 + React + TypeScript organizado em MVC, no estilo Angular.
      </p>

      <dl className="runtime">
        <div>
          <dt>Aplicação</dt>
          <dd>{info?.name ?? "…"}</dd>
        </div>
        <div>
          <dt>Versão</dt>
          <dd>{info?.version ?? "…"}</dd>
        </div>
        <div>
          <dt>Perfil</dt>
          <dd>{info?.profile ?? "…"}</dd>
        </div>
        <div>
          <dt>Plataforma</dt>
          <dd>{info?.os ?? "…"}</dd>
        </div>
      </dl>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <Link className="button" to={routes.tasks}>
          Abrir tarefas
        </Link>
        <Link className="button ghost" to={routes.about}>
          Sobre a arquitetura
        </Link>
      </div>
    </section>
  );
}
