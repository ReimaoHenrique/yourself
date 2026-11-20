import { routes } from "../../routes";
import "./AboutView.css";

/** View estática: documenta a arquitetura do projeto. */
export function AboutView() {
  return (
    <section className="view about-view">
      <h1>Sobre a arquitetura</h1>

      <p className="lead">
        O fluxo segue MVC, como em Angular: a <strong>View</strong> não fala
        com o backend — ela aciona o <strong>Controller</strong>, que orquestra
        o <strong>Service</strong>, que por fim chama o comando Rust.
      </p>

      <ol className="layers">
        <li>
          <span className="layer">View</span>
          <code>src/app/views/</code>
          <p>Componentes React. Só renderizam estado vindo do Controller.</p>
        </li>
        <li>
          <span className="layer">Controller</span>
          <code>src/app/controllers/</code>
          <p>
            Hooks que mantêm estado, chamam Services e devolvem ações para a
            View.
          </p>
        </li>
        <li>
          <span className="layer">Service</span>
          <code>src/app/services/</code>
          <p>
            Único ponto que conhece o Tauri. Encapsula todos os{" "}
            <code>invoke()</code>.
          </p>
        </li>
        <li>
          <span className="layer">Model</span>
          <code>src/app/models/ + src-tauri/src/lib.rs</code>
          <p>
            Contratos de dados compartilhados, espelhados entre TS e Rust.
          </p>
        </li>
        <li>
          <span className="layer">Rotas</span>
          <code>src/app/routes/</code>
          <p>
            Mapa central de caminhos + componente <code>AppRoutes</code>.
          </p>
        </li>
      </ol>

      <p>
        <a href={routes.home}>← Voltar para o início</a>
      </p>
    </section>
  );
}
