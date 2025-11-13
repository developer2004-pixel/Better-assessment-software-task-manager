from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, Optional
from flask import Blueprint, jsonify, request, abort

@dataclass
class Task:
    id: int
    title: str
    completed: bool = False

# In-memory store for demo/dev; replace with DB later
_tasks: Dict[int, Task] = {}
_next_id: int = 1

tasks_bp = Blueprint("tasks", __name__)


def _get_next_id() -> int:
    global _next_id
    nid = _next_id
    _next_id += 1
    return nid


@tasks_bp.get("/tasks")
def list_tasks():
    return jsonify([asdict(t) for t in _tasks.values()])


@tasks_bp.post("/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        abort(400, description="title is required")
    task = Task(id=_get_next_id(), title=title, completed=bool(data.get("completed", False)))
    _tasks[task.id] = task
    return jsonify(asdict(task)), 201


@tasks_bp.get("/tasks/<int:task_id>")
def get_task(task_id: int):
    task = _tasks.get(task_id)
    if not task:
        abort(404)
    return jsonify(asdict(task))


@tasks_bp.put("/tasks/<int:task_id>")
@tasks_bp.patch("/tasks/<int:task_id>")
def update_task(task_id: int):
    task = _tasks.get(task_id)
    if not task:
        abort(404)
    data = request.get_json(silent=True) or {}
    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            abort(400, description="title cannot be empty")
        task.title = title
    if "completed" in data:
        task.completed = bool(data.get("completed"))
    _tasks[task_id] = task
    return jsonify(asdict(task))


@tasks_bp.delete("/tasks/<int:task_id>")
def delete_task(task_id: int):
    if task_id not in _tasks:
        abort(404)
    del _tasks[task_id]
    return "", 204
