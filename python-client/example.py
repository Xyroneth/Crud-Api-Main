from task_manager_client import TaskManagerClient

client = TaskManagerClient()
task = client.create_task("Call the API from Python", priority="high")
print(task)

completed = client.update_task(task.id, status="done")
print(completed)
