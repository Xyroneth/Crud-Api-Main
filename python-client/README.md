# Python client

This dependency-free Python 3.10+ package wraps the Task Manager API with typed task objects and CRUD methods.

It provides `create_task`, `list_tasks`, `get_task`, `update_task`, and `delete_task`, typed status and priority values, configurable timeouts, and structured `ApiError` exceptions.

```powershell
cd python-client
python -m pip install -e .
python example.py
python -m unittest discover -s tests -v
```
