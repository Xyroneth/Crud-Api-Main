import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app';
import { TaskModel } from '../src/models/task.model';

let mongo: MongoMemoryServer | undefined;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await TaskModel.init();
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) await TaskModel.deleteMany({});
});
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const validTask = {
  title: 'Prepare release',
  description: 'Check every artifact',
  priority: 'high',
  status: 'todo',
};

describe('service endpoints', () => {
  it('reports health, metrics, docs, egg, request id, and unknown routes', async () => {
    const health = await request(app).get('/health').set('x-request-id', 'test-id');
    expect(health.status).toBe(200);
    expect(health.headers['x-request-id']).toBe('test-id');
    expect(health.body.status).toBe('ok');
    expect((await request(app).get('/metrics')).text).toContain('http_requests_total');
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect((await request(app).get('/api/v1/egg')).body.data.message).toContain('egg');
    expect((await request(app).get('/missing')).body.error.code).toBe('ROUTE_NOT_FOUND');
    expect((await request(app).get('/health')).headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('task CRUD', () => {
  it('creates, reads, replaces, patches, lists, filters, and deletes tasks', async () => {
    const created = await request(app).post('/api/v1/tasks').send(validTask).expect(201);
    const id = created.body.data._id as string;
    expect(created.body.data.title).toBe(validTask.title);

    const fetched = await request(app).get(`/api/v1/tasks/${id}`).expect(200);
    expect(fetched.body.data.priority).toBe('high');

    await request(app)
      .put(`/api/v1/tasks/${id}`)
      .send({ title: 'Replaced', description: '', status: 'in-progress', priority: 'medium' })
      .expect(200);
    const patched = await request(app)
      .patch(`/api/v1/tasks/${id}`)
      .send({ status: 'done' })
      .expect(200);
    expect(patched.body.data.status).toBe('done');

    await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Another task', priority: 'low' })
      .expect(201);
    const list = await request(app)
      .get('/api/v1/tasks?status=done&limit=10&page=1&sort=title')
      .expect(200);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 10, total: 1, pages: 1 });
    expect(list.body.data[0].title).toBe('Replaced');
    const search = await request(app).get('/api/v1/tasks?search=Another&priority=low').expect(200);
    expect(search.body.data).toHaveLength(1);

    await request(app).delete(`/api/v1/tasks/${id}`).expect(204);
    await request(app).get(`/api/v1/tasks/${id}`).expect(404);
  });

  it('returns consistent validation and identifier errors', async () => {
    const invalid = await request(app).post('/api/v1/tasks').send({ title: '' }).expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).patch(`/api/v1/tasks/${new mongoose.Types.ObjectId()}`).send({}).expect(400);
    await request(app).get('/api/v1/tasks?page=0').expect(400);
    await request(app).patch('/api/v1/tasks/not-an-id').send({ status: 'done' }).expect(400);
    const missingId = new mongoose.Types.ObjectId().toString();
    await request(app).patch(`/api/v1/tasks/${missingId}`).send({ status: 'done' }).expect(404);
    await request(app).delete(`/api/v1/tasks/${missingId}`).expect(404);
  });
});
