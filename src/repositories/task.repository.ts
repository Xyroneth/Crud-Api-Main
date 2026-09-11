import { FilterQuery } from 'mongoose';
import { Task, TaskDocument, TaskModel } from '../models/task.model';
import { CreateTaskDto, ListTasksQuery, UpdateTaskDto } from '../validation/task.schemas';

export interface TaskListResult {
  items: TaskDocument[];
  total: number;
}

export class TaskRepository {
  create(input: CreateTaskDto): Promise<TaskDocument> {
    return TaskModel.create(input);
  }

  async list(query: ListTasksQuery): Promise<TaskListResult> {
    const filter: FilterQuery<Task> = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search) filter.$text = { $search: query.search };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      TaskModel.find(filter).sort(query.sort).skip(skip).limit(query.limit).exec(),
      TaskModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  findById(id: string): Promise<TaskDocument | null> {
    return TaskModel.findById(id).exec();
  }

  update(id: string, input: UpdateTaskDto | CreateTaskDto): Promise<TaskDocument | null> {
    return TaskModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec();
  }

  delete(id: string): Promise<TaskDocument | null> {
    return TaskModel.findByIdAndDelete(id).exec();
  }
}
