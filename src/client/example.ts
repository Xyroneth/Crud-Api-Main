import { TaskManagerClient } from './generated';

const client = new TaskManagerClient();
void client.create({ title: 'Ship the API', priority: 'high' }).then(console.log);
