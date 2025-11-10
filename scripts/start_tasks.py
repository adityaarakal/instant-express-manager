#!/usr/bin/env python3
"""
Simple CLI helper that reads `docs/tasks.md` and prints tasks in order.

Usage:
    python scripts/start_tasks.py

Options:
    --next       Print only the next task (first uncompleted heading).
    --all        Print all tasks sequentially (default).
    --search STR Filter tasks containing STR (case-insensitive).

The script recognises lines starting with `### Task` as actionable items.
It strips bullet points underneath and prints them for quick reference.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[1]
TASKS_FILE = ROOT_DIR / "docs" / "tasks.md"


TASK_HEADING_RE = re.compile(r"^###\s+(Task\s+\d+\s+–\s+.+)$")


def parse_tasks(lines: Iterable[str]) -> List[Tuple[str, List[str]]]:
    sections: List[Tuple[str, List[str]]] = []
    current_title: str | None = None
    current_body: List[str] = []

    for line in lines:
        match = TASK_HEADING_RE.match(line.strip())
        if match:
            if current_title:
                sections.append((current_title, current_body))
            current_title = match.group(1)
            current_body = []
        elif current_title:
            if line.strip():
                current_body.append(line.strip())
    if current_title:
        sections.append((current_title, current_body))
    return sections


def task_is_completed(title: str) -> bool:
    return "*(Completed)*" in title


def task_is_in_progress(title: str) -> bool:
    return "*(In Progress)*" in title


def format_task(title: str, body: List[str]) -> str:
    bullet_lines = []
    for item in body:
        bullet_lines.append(f"  - {item.lstrip('- ').strip()}")
    bullet_text = "\n".join(bullet_lines) if bullet_lines else "  (No details provided.)"

    return f"{title}\n{bullet_text}\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="List tasks defined in docs/tasks.md")
    parser.add_argument(
        "--next",
        action="store_true",
        help="Show only the next incomplete task.",
    )
    parser.add_argument(
        "--include-completed",
        action="store_true",
        help="Include completed tasks when listing.",
    )
    parser.add_argument(
        "--search",
        type=str,
        default=None,
        help="Filter tasks containing the search string (case-insensitive).",
    )
    args = parser.parse_args()

    if not TASKS_FILE.exists():
        raise SystemExit(f"Tasks file not found at {TASKS_FILE}")

    lines = TASKS_FILE.read_text(encoding="utf-8").splitlines()
    tasks = parse_tasks(lines)

    if not args.include_completed:
        tasks = [t for t in tasks if not task_is_completed(t[0])]

    if args.search:
        query = args.search.lower()
        tasks = [
            (title, body)
            for title, body in tasks
            if query in title.lower() or any(query in item.lower() for item in body)
        ]

    if args.next and tasks:
        tasks = tasks[:1]

    if not tasks:
        print("No tasks found.")
        return

    for title, body in tasks:
        print(format_task(title, body))


if __name__ == "__main__":
  main()

