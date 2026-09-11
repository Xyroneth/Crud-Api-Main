import { TaskRepository } from '../repositories/task.repository';
import { AppError } from '../utils/app-error';
import { CreateTaskDto, ListTasksQuery, UpdateTaskDto } from '../validation/task.schemas';

export class TaskService {
  constructor(private readonly repository = new TaskRepository()) {}

  create(input: CreateTaskDto) {
    return this.repository.create(input);
  }

  async list(query: ListTasksQuery) {
    const { items, total } = await this.repository.list(query);
    return {
      data: items,
      meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
  }

  async get(id: string) {
    const task = await this.repository.findById(id);
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
    return task;
  }

  async update(id: string, input: UpdateTaskDto | CreateTaskDto) {
    const task = await this.repository.update(id, input);
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
    return task;
  }

  async delete(id: string) {
    const task = await this.repository.delete(id);
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
  }
}
