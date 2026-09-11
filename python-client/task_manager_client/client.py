"""Dependency-free Python client for the Task Manager API."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Literal, Mapping
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

TaskStatus = Literal["todo", "in-progress", "done"]
TaskPriority = Literal["low", "medium", "high"]


class ApiError(RuntimeError):
    """Raised when the API returns a non-successful response."""

    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(f"{code}: {message}")
        self.status = status
        self.code = code
        self.message = message


@dataclass(frozen=True, slots=True)
class Task:
    id: str
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    due_date: str | None
    created_at: str
    updated_at: str

    @classmethod
    def from_api(cls, data: Mapping[str, Any]) -> Task:
        return cls(
            id=str(data["_id"]),
            title=str(data["title"]),
            description=str(data.get("description", "")),
            status=data["status"],
            priority=data["priority"],
            due_date=data.get("dueDate"),
            created_at=str(data["createdAt"]),
            updated_at=str(data["updatedAt"]),
        )


class TaskManagerClient:
    def __init__(self, base_url: str = "http://localhost:3000/api/v1", timeout: float = 10) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _request(self, method: str, path: str, body: Mapping[str, Any] | None = None) -> Any:
        payload = None if body is None else json.dumps(body).encode("utf-8")
        request = Request(
            f"{self.base_url}{path}",
            data=payload,
            method=method,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                if response.status == 204:
                    return None
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            response = json.loads(error.read().decode("utf-8"))
            details = response.get("error", {})
            raise ApiError(error.code, details.get("code", "HTTP_ERROR"), details.get("message", str(error))) from error

    def create_task(
        self,
        title: str,
        description: str = "",
        status: TaskStatus = "todo",
        priority: TaskPriority = "medium",
        due_date: str | None = None,
    ) -> Task:
        response = self._request(
            "POST",
            "/tasks",
            {"title": title, "description": description, "status": status, "priority": priority, "dueDate": due_date},
        )
        return Task.from_api(response["data"])

    def list_tasks(self, **filters: str | int | None) -> tuple[list[Task], Mapping[str, int]]:
        query = urlencode({key: value for key, value in filters.items() if value is not None})
        response = self._request("GET", f"/tasks{'?' + query if query else ''}")
        return [Task.from_api(item) for item in response["data"]], response["meta"]

    def get_task(self, task_id: str) -> Task:
        return Task.from_api(self._request("GET", f"/tasks/{task_id}")["data"])

    def update_task(self, task_id: str, **changes: Any) -> Task:
        if "due_date" in changes:
            changes["dueDate"] = changes.pop("due_date")
        return Task.from_api(self._request("PATCH", f"/tasks/{task_id}", changes)["data"])

    def delete_task(self, task_id: str) -> None:
        self._request("DELETE", f"/tasks/{task_id}")
