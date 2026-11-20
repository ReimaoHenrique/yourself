import { Link } from "react-router-dom";
import { routes } from "../../routes";
import "./NotFoundView.css";

export function NotFoundView() {
  return (
    <section className="view notfound-view">
      <h1>404</h1>
      <p className="lead">Esta rota não existe.</p>
      <Link className="button" to={routes.home}>
        Voltar ao início
      </Link>
    </section>
  );
}
