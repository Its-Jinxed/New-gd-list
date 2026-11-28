import json
import subprocess
from pathlib import Path

LIST_FILE = "data/_list.json"
LEGACY_FILE = "data/_legacy.json"
OUTPUT_FILE = "data/_positionHistory.json"

# First official historical snapshot
START_COMMIT = "490ae9f58d9d48e2fd9a2a4ad1df405cfbb12187"


def git(*args):
    return subprocess.check_output(
        ["git", *args],
        text=True,
        encoding="utf-8"
    ).strip()


def read_json_at_commit(commit, path):
    try:
        content = subprocess.check_output(
            ["git", "show", f"{commit}:{path}"],
            text=True,
            encoding="utf-8",
            stderr=subprocess.DEVNULL
        )
    except subprocess.CalledProcessError:
        return []

    data = json.loads(content)

    if not isinstance(data, list):
        raise ValueError(f"Invalid list: {path} at {commit}")

    return data


commits = git(
    "rev-list",
    "--first-parent",
    "--reverse",
    "HEAD"
).splitlines()

if START_COMMIT not in commits:
    raise RuntimeError(
        "Starting commit not found in production history."
    )

commits = commits[commits.index(START_COMMIT):]

history = []
previous_state = None

for commit in commits:

    levels = read_json_at_commit(commit, LIST_FILE)
    legacy = read_json_at_commit(commit, LEGACY_FILE)

    state = {
        "levels": levels,
        "legacy": legacy
    }

    if state == previous_state:
        continue

    date = git(
        "show",
        "-s",
        "--format=%cI",
        commit
    )

    history.append({
        "date": date,
        "commit": commit,
        "levels": levels,
        "legacy": legacy
    })

    previous_state = state

    print(f"Recorded snapshot: {date}")


Path(OUTPUT_FILE).parent.mkdir(
    parents=True,
    exist_ok=True
)

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(
        history,
        file,
        indent=4,
        ensure_ascii=False
    )
    file.write("\n")

print(f"Generated {len(history)} historical snapshots.")
