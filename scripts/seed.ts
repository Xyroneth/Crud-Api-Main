import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { TaskModel } from '../src/models/task.model';

const verbs = [
  'Draft',
  'Review',
  'Ship',
  'Test',
  'Document',
  'Design',
  'Measure',
  'Refactor',
  'Deploy',
  'Validate',
];
const objects = [
  'API contract',
  'onboarding flow',
  'release notes',
  'database index',
  'backup plan',
];

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  const now = Date.now();
  const tasks = Array.from({ length: 50 }, (_, index) => ({
    title: `${verbs[index % verbs.length]} ${objects[index % objects.length]} #${index + 1}`,
    description: `Seeded task ${index + 1} for local demonstration and testing.`,
    status: ['todo', 'in-progress', 'done'][index % 3],
    priority: ['low', 'medium', 'high'][index % 3],
    dueDate: new Date(now + (index + 1) * 86_400_000),
  }));
  await TaskModel.deleteMany({});
  await TaskModel.insertMany(tasks);
  process.stdout.write(`Seeded ${tasks.length} tasks.\n`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
