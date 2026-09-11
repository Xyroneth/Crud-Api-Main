import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    description: { type: String, default: '', maxlength: 5000 },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    dueDate: { type: Date, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);

taskSchema.index({ title: 'text', description: 'text' });

export type Task = InferSchemaType<typeof taskSchema>;
export type TaskDocument = HydratedDocument<Task>;
export const TaskModel = model<Task>('Task', taskSchema);
