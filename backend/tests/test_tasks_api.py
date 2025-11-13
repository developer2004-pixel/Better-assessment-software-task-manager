from typing import Generator
import pytest
from app import create_app

@pytest.fixture()
def client() -> Generator:
    app = create_app()
    with app.test_client() as client:
        yield client


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_tasks_crud(client):
    """Happy-path CRUD flow for tasks.

    This keeps the main flow compact and readable for assessors.
    """
    # empty list
    resp = client.get("/api/tasks")
    assert resp.status_code == 200
    assert resp.get_json() == []

    # create
    resp = client.post("/api/tasks", json={"title": "First"})
    assert resp.status_code == 201
    task = resp.get_json()
    assert task["title"] == "First"
    tid = task["id"]

    # read
    resp = client.get(f"/api/tasks/{tid}")
    assert resp.status_code == 200

    # update
    resp = client.patch(f"/api/tasks/{tid}", json={"completed": True})
    assert resp.status_code == 200
    assert resp.get_json()["completed"] is True

    # list
    resp = client.get("/api/tasks")
    assert len(resp.get_json()) == 1

    # delete
    resp = client.delete(f"/api/tasks/{tid}")
    assert resp.status_code == 204

    # 404 after delete
    resp = client.get(f"/api/tasks/{tid}")
    assert resp.status_code == 404


def test_create_task_requires_title(client):
    """Creating a task without a non-empty title should fail with 400."""
    # missing body
    resp = client.post("/api/tasks", json=None)
    assert resp.status_code == 400

    # empty or whitespace-only title
    for payload in ({"title": ""}, {"title": "   "}):
        resp = client.post("/api/tasks", json=payload)
        assert resp.status_code == 400


def test_update_task_validates_title(client):
    """Updating a task to an empty title should be rejected with 400."""
    # create a valid task first
    resp = client.post("/api/tasks", json={"title": "Initial"})
    assert resp.status_code == 201
    tid = resp.get_json()["id"]

    # attempt to blank the title
    resp = client.patch(f"/api/tasks/{tid}", json={"title": "   "})
    assert resp.status_code == 400


def test_not_found_on_unknown_task(client):
    """Accessing a non-existent task id should return 404 consistently."""
    resp = client.get("/api/tasks/9999")
    assert resp.status_code == 404

    resp = client.patch("/api/tasks/9999", json={"completed": True})
    assert resp.status_code == 404

    resp = client.delete("/api/tasks/9999")
    assert resp.status_code == 404
