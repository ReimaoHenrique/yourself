import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateTaskDTO, Task, TaskFilter } from "../models";
import { taskService } from "../services";

/**
 * Controller — nenhuma lógica de UI e nenhum `invoke` aqui.
 *
 * Responsabilidade: orquestrar o Service, expor estado e ações para a View.
 * A View consome apenas o que este hook devolve.
 */
export function useTasksController() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setTasks(await taskService.list());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (dto: CreateTaskDTO) => {
      const created = await taskService.create(dto);
      if (created) {
        setTasks((current) => [...current, created]);
      }
      return created;
    },
    [],
  );

  const toggle = useCallback(async (id: number) => {
    const updated = await taskService.toggle(id);
    if (updated) {
      setTasks((current) =>
        current.map((task) => (task.id === id ? updated : task)),
      );
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    const ok = await taskService.remove(id);
    if (ok) {
      setTasks((current) => current.filter((task) => task.id !== id));
    }
    return ok;
  }, []);

  const visible = useMemo(() => {
    switch (filter) {
      case "pending":
        return tasks.filter((task) => !task.done);
      case "done":
        return tasks.filter((task) => task.done);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      done: tasks.filter((task) => task.done).length,
      pending: tasks.filter((task) => !task.done).length,
    }),
    [tasks],
  );

  return {
    tasks: visible,
    stats,
    filter,
    setFilter,
    loading,
    error,
    create,
    toggle,
    remove,
    refresh,
  };
}

export type TasksController = ReturnType<typeof useTasksController>;
