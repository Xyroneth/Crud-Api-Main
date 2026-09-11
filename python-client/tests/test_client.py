import io
import json
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from task_manager_client import ApiError, TaskManagerClient


class Response:
    def __init__(self, payload=None, status=200):
        self.status = status
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return json.dumps(self.payload).encode() if self.payload is not None else b""


TASK = {
    "_id": "abc123",
    "title": "Python task",
    "description": "",
    "status": "todo",
    "priority": "high",
    "dueDate": None,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
}


class ClientTests(unittest.TestCase):
    def setUp(self):
        self.client = TaskManagerClient("http://example.test/api/v1")

    @patch("task_manager_client.client.urlopen")
    def test_crud_methods(self, urlopen):
        urlopen.side_effect = [
            Response({"data": TASK}, 201),
            Response({"data": [TASK], "meta": {"page": 1, "limit": 20, "total": 1, "pages": 1}}),
            Response({"data": TASK}),
            Response({"data": {**TASK, "status": "done"}}),
            Response(status=204),
        ]
        task = self.client.create_task("Python task", priority="high")
        tasks, meta = self.client.list_tasks(page=1, status="todo")
        self.assertEqual(self.client.get_task(task.id).id, "abc123")
        self.assertEqual(
            self.client.update_task(task.id, status="done", due_date="2026-02-01T00:00:00Z").status,
            "done",
        )
        self.assertIsNone(self.client.delete_task(task.id))
        self.assertEqual(tasks[0].title, "Python task")
        self.assertEqual(meta["total"], 1)
        patch_request = urlopen.call_args_list[3].args[0]
        self.assertIn(b'"dueDate": "2026-02-01T00:00:00Z"', patch_request.data)

    @patch("task_manager_client.client.urlopen")
    def test_api_error(self, urlopen):
        body = io.BytesIO(b'{"error":{"code":"TASK_NOT_FOUND","message":"Task not found"}}')
        urlopen.side_effect = HTTPError("url", 404, "Not Found", {}, body)
        with self.assertRaises(ApiError) as context:
            self.client.get_task("missing")
        self.assertEqual(context.exception.status, 404)


if __name__ == "__main__":
    unittest.main()
