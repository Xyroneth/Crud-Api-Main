export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}
export interface Task extends Required<Omit<TaskInput, 'dueDate'>> {
  _id: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TaskManagerClient {
  constructor(private readonly baseUrl = 'http://localhost:3000/api/v1') {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return (response.status === 204 ? undefined : response.json()) as T;
  }
  create(input: TaskInput) {
    return this.request<{ data: Task }>('/tasks', { method: 'POST', body: JSON.stringify(input) });
  }
  list(query = '') {
    return this.request<{
      data: Task[];
      meta: { page: number; limit: number; total: number; pages: number };
    }>(`/tasks${query}`);
  }
  get(id: string) {
    return this.request<{ data: Task }>(`/tasks/${id}`);
  }
  replace(id: string, input: TaskInput) {
    return this.request<{ data: Task }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }
  update(id: string, input: Partial<TaskInput>) {
    return this.request<{ data: Task }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }
  delete(id: string) {
    return this.request<void>(`/tasks/${id}`, { method: 'DELETE' });
  }
}
