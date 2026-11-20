import { useState, type FormEvent } from "react";
import { useTasksController } from "../../controllers";
import type { TaskFilter } from "../../models";
import { routes } from "../../routes";
import "./TasksView.css";

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "done", label: "Concluídas" },
];

/** View da lista de tarefas — consome apenas o `useTasksController`. */
export function TasksView() {
  const {
    tasks,
    stats,
    filter,
    setFilter,
    loading,
    error,
    create,
    toggle,
    remove,
  } = useTasksController();

  const [title, setTitle] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const created = await create({ title });
    if (created) setTitle("");
  }

  return (
    <section className="view tasks-view">
      <header className="tasks-header">
        <h1>Tarefas</h1>
        <span className="badge">
          {stats.done}/{stats.total} concluídas
        </span>
      </header>

      <form className="task-form" onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="O que precisa ser feito?"
          aria-label="Nova tarefa"
        />
        <button type="submit" disabled={!title.trim()}>
          Adicionar
        </button>
      </form>

      <div className="filters" role="tablist" aria-label="Filtrar tarefas">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className={filter === option.value ? "active" : ""}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Carregando…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p className="muted">Nada por aqui. Adicione uma tarefa acima.</p>
      )}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.done ? "done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => void toggle(task.id)}
              />
              <span>{task.title}</span>
            </label>
            <button
              type="button"
              className="remove"
              aria-label={`Remover ${task.title}`}
              onClick={() => void remove(task.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <p>
        <a href={routes.home}>← Voltar</a>
      </p>
    </section>
  );
}
