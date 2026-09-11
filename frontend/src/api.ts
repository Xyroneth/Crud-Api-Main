export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || `Request failed (${response.status})`);
  }
  return (response.status === 204 ? undefined : response.json()) as T;
}

export const api = {
  list: (status?: TaskStatus) =>
    request<{ data: Task[] }>(
      `/api/v1/tasks?limit=100&sort=-createdAt${status ? `&status=${status}` : ''}`,
    ),
  create: (input: TaskInput) =>
    request<{ data: Task }>('/api/v1/tasks', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: Partial<TaskInput>) =>
    request<{ data: Task }>(`/api/v1/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  delete: (id: string) => request<void>(`/api/v1/tasks/${id}`, { method: 'DELETE' }),
};
