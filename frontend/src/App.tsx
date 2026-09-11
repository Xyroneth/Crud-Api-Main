import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, Task, TaskPriority, TaskStatus } from './api';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('taskflow-theme') !== 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('taskflow-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.list(filter === 'all' ? undefined : filter);
      setTasks(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      active: tasks.filter((task) => task.status === 'in-progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
    }),
    [tasks],
  );

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError('');
    try {
      await api.create({
        title: String(form.get('title') || ''),
        description: String(form.get('description') || ''),
        priority: String(form.get('priority')) as TaskPriority,
        dueDate: form.get('dueDate') ? new Date(String(form.get('dueDate'))).toISOString() : null,
      });
      formElement.reset();
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create task');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task: Task, status: TaskStatus) => {
    setError('');
    try {
      const response = await api.update(task._id, { status });
      setTasks((current) => current.map((item) => (item._id === task._id ? response.data : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update task');
    }
  };

  const deleteTask = async (task: Task) => {
    setError('');
    try {
      await api.delete(task._id);
      setTasks((current) => current.filter((item) => item._id !== task._id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete task');
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Taskflow home">
          <span className="brand-mark">T</span>
          <span>taskflow</span>
        </a>
        <button
          className="theme-button"
          type="button"
          onClick={() => setDark((value) => !value)}
          aria-label="Toggle color theme"
        >
          {dark ? '☀︎' : '◐'}
        </button>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">YOUR FOCUS SPACE</p>
          <h1>
            Make room for
            <br />
            <em>what matters.</em>
          </h1>
          <p className="hero-copy">
            A calm place to capture your work, choose what’s next, and finish with intention.
          </p>
        </div>
        <div className="summary-card" aria-label="Task summary">
          <div>
            <strong>{counts.all}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{counts.active}</strong>
            <span>In motion</span>
          </div>
          <div>
            <strong>{counts.done}</strong>
            <span>Complete</span>
          </div>
        </div>
      </section>

      <section className="workspace">
        <form className="composer" onSubmit={createTask}>
          <div className="composer-heading">
            <span>New task</span>
            <span className="composer-rule" />
          </div>
          <label>
            <span>What needs doing?</span>
            <input name="title" required maxLength={200} placeholder="Write a clear next step…" />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              name="description"
              maxLength={5000}
              placeholder="Add context (optional)"
              rows={3}
            />
          </label>
          <div className="form-row">
            <label>
              <span>Priority</span>
              <select name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              <span>Due date</span>
              <input name="dueDate" type="date" />
            </label>
          </div>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Adding…' : 'Add task'}
            <span>↗</span>
          </button>
        </form>

        <div className="task-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">THE LIST</p>
              <h2>Your tasks</h2>
            </div>
            <button className="refresh" onClick={() => void loadTasks()} aria-label="Refresh tasks">
              ↻
            </button>
          </div>
          <div className="filters" aria-label="Filter tasks">
            {(['all', 'todo', 'in-progress', 'done'] as const).map((value) => (
              <button
                key={value}
                className={filter === value ? 'active' : ''}
                onClick={() => setFilter(value)}
              >
                {value === 'all' ? 'All' : statusLabels[value]}
              </button>
            ))}
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {loading ? (
            <div className="empty">Loading your focus space…</div>
          ) : tasks.length === 0 ? (
            <div className="empty">
              <span>○</span>
              <h3>Nothing here yet</h3>
              <p>Add a task and give your day a direction.</p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-card" key={task._id}>
                  <div className={`priority priority-${task.priority}`}>{task.priority}</div>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      {task.dueDate
                        ? `Due ${new Date(task.dueDate).toLocaleDateString()}`
                        : 'No due date'}
                    </div>
                  </div>
                  <select
                    aria-label={`Status for ${task.title}`}
                    value={task.status}
                    onChange={(event) => void updateStatus(task, event.target.value as TaskStatus)}
                  >
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    className="delete"
                    onClick={() => void deleteTask(task)}
                    aria-label={`Delete ${task.title}`}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <footer>
        <span>Taskflow</span>
        <span>API connected · Built for clarity</span>
      </footer>
    </main>
  );
}

export default App;
