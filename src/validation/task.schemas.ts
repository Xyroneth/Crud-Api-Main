import { z } from 'zod';

const fields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(''),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.coerce.date().nullable().optional(),
};

export const createTaskSchema = z.object(fields).strict();
export const replaceTaskSchema = z.object(fields).strict();
export const updateTaskSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  });

export const listTasksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z
    .enum(['createdAt', '-createdAt', 'dueDate', '-dueDate', 'title', '-title'])
    .default('-createdAt'),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksSchema>;
