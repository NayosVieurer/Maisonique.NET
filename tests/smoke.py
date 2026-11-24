"""Exercise the real ASP.NET service and an isolated SQLite file. Uses only Python's standard library."""
import concurrent.futures
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "server"
DOTNET = os.environ.get("DOTNET", "dotnet")
HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))
WEEK = "2026-03-23"  # Includes the UK spring clock change.


def build():
    subprocess.run([DOTNET, "build", str(SERVER / "KitchenTable.csproj"), "-c", "Release",
                    "--nologo", "-p:RestoreLockedMode=true"], cwd=ROOT, check=True)


@contextmanager
def running(data_dir):
    log = Path(data_dir) / "server.log"
    env = {**os.environ, "KitchenTable__DatabasePath": str(Path(data_dir) / "test.db"),
           "KitchenTable__TimeZone": "Europe/London", "ASPNETCORE_ENVIRONMENT": "Production"}
    with log.open("w") as output:
        proc = subprocess.Popen([DOTNET, str(SERVER / "bin/Release/net10.0/KitchenTable.dll"),
                                 "--urls", "http://127.0.0.1:0"], cwd=SERVER, env=env,
                                stdout=output, stderr=subprocess.STDOUT)
        try:
            for _ in range(300):
                text = log.read_text(errors="replace")
                match = re.search(r"Now listening on: (http://127\.0\.0\.1:\d+)", text)
                if match:
                    yield match.group(1)
                    break
                if proc.poll() is not None:
                    raise RuntimeError(text)
                time.sleep(0.1)
            else:
                raise RuntimeError("Server startup timed out. " + log.read_text(errors="replace"))
        finally:
            proc.terminate()
            try:
                proc.wait(8)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()


def call(origin, method, path, body=None, expected=204, header=True):
    headers = {"Content-Type": "application/json"}
    if header:
        headers["X-Kitchen-Table"] = "1"
    request = urllib.request.Request(origin + "/api" + path,
                                     data=None if body is None else json.dumps(body).encode(),
                                     headers=headers, method=method)
    try:
        response = HTTP.open(request, timeout=15)
    except urllib.error.HTTPError as exc:
        response = exc
    with response:
        raw = response.read().decode()
        if expected is None:
            return response.status
        if response.status != expected:
            raise AssertionError(f"{method} {path} returned {response.status}, expected {expected}: {raw}")
    return json.loads(raw) if raw else None


def week(origin, start=WEEK):
    return call(origin, "GET", "/week?start=" + start, expected=200)


def exercise(origin):
    def api(method, path, body=None, expected=204):
        return call(origin, method, path, body, expected)

    def fresh():
        return uuid.uuid4().hex

    def item(label, unit=""):
        return next(i for i in week(origin)["shopping"] if i["label"].lower() == label and i["unit"].lower() == unit)

    board = week(origin)
    assert len(board["recipes"]) == 1 and board["people"] == [] and board["shopping"] == []
    assert api("GET", "/health", expected=200)["status"] == "ok"
    api("GET", "/week?start=2026-03-24", expected=400)
    api("GET", "/week?start=2026-02-31", expected=400)
    person, recipe, chore, meeting, meal = [fresh() for _ in range(5)]
    profile = {"name": "Sam", "colour": "#32634B", "version": 0}
    call(origin, "PUT", "/people/" + person, profile, 400, header=False)
    api("PUT", "/people/" + person, profile)
    api("PUT", "/people/" + person, {**profile, "name": "Alex"}, 409)
    recipe_body = {"title": "Rice bowl", "servings": 4, "version": 0, "steps": ["Cook the rice."],
                   "ingredients": [{"name": "Rice", "amount": 200, "unit": "g"},
                                   {"name": " RICE ", "amount": 4, "unit": " G "},
                                   {"name": "rice", "amount": 1, "unit": "cup"},
                                   {"name": "Salt", "amount": None, "unit": "to taste"}]}
    api("PUT", "/recipes/" + recipe, {**recipe_body, "ingredients": []}, 400)
    api("PUT", "/recipes/" + recipe, recipe_body)
    entry = {"version": 0, "kind": "event", "day": "2026-03-29", "title": "Library",
             "startTime": "09:00", "endTime": "09:45", "personId": person}
    api("PUT", "/entries/" + meeting, {**entry, "endTime": "08:00"}, 400)
    api("PUT", "/entries/" + meeting, entry)
    api("PUT", "/entries/" + fresh(), {**entry, "day": "2026-03-30"})
    api("PATCH", "/entries/" + meeting + "/done", {"done": True}, 404)
    api("PUT", "/entries/" + chore, {**entry, "kind": "chore", "title": "Water plants",
                                      "startTime": None, "endTime": None})
    for _ in range(2):
        api("PATCH", "/entries/" + chore + "/done", {"done": True})
    assert len(week(origin)["entries"]) == 2
    assert len(week(origin, "2026-03-30")["entries"]) == 1
    assert next(e for e in week(origin)["entries"] if e["id"] == chore)["version"] == 2
    api("DELETE", "/people/" + person + "?version=1", expected=409)

    plan = {"day": WEEK, "slot": "Dinner", "recipeId": recipe, "servings": 2, "version": 0}
    api("PUT", "/meals/" + meal, plan)
    assert item("rice", "g")["amount"] == 102
    assert item("rice", "cup")["amount"] == 0.5
    assert item("salt", "to taste")["amount"] is None
    old_key = item("rice", "g")["id"]
    prefix = "/shopping/" + WEEK
    for _ in range(2):
        api("PATCH", prefix + "/" + old_key + "/done", {"done": True})
    assert item("rice", "g")["done"]
    extra = fresh()
    for _ in range(2):
        api("PUT", prefix + "/extras/" + extra, {"label": "Soap"})
    api("PATCH", prefix + "/" + extra + "/done", {"done": True})
    assert len([i for i in week(origin)["shopping"] if i["manual"]]) == 1

    competing = [fresh(), fresh()]
    def reserve(key):
        return call(origin, "PUT", "/meals/" + key, {**plan, "slot": "Lunch", "servings": 6}, None)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(reserve, competing)) == [204, 409]
    assert item("rice", "g")["amount"] == 408 and not item("rice", "g")["done"]
    assert item("soap")["done"] and week(origin, "2026-03-30")["shopping"] == []
    api("PATCH", prefix + "/" + old_key + "/done", {"done": True}, 409)
    api("DELETE", "/recipes/" + recipe + "?version=1", expected=409)
    api("PUT", "/meals/" + meal, {**plan, "version": 1, "servings": 4})
    api("PUT", "/meals/" + meal, {**plan, "version": 1, "servings": 2}, 409)
    assert item("rice", "g")["amount"] == 510
    api("DELETE", "/meals/" + meal + "?version=1", expected=409)
    api("DELETE", "/meals/" + meal + "?version=2")
    api("DELETE", "/meals/" + meal + "?version=2")
    assert item("rice", "g")["amount"] == 306
    return week(origin)


if __name__ == "__main__":
    build()
    with tempfile.TemporaryDirectory() as directory:
        with running(directory) as origin:
            previous = exercise(origin)
        with running(directory) as origin:
            restored = week(origin)
            for key in ("people", "recipes", "entries", "meals", "shopping"):
                assert restored[key] == previous[key], "Restart changed " + key
    print("Passed: validation, calendar boundaries, chore checks, shopping scaling, overlapping edits, slot races and persistence.")
