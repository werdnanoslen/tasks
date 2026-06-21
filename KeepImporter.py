import argparse
import getpass
import json
import mimetypes
import random
import sys
import uuid
from pathlib import Path

import requests


def convert_keep_to_task(data, user_id):
    task_id = str(uuid.uuid4())
    pinned = data.get("isPinned", False)

    img_filename = None
    attachments = data.get("attachments", [])
    if attachments:
        img_filename = attachments[0].get("filePath")

    if "listContent" in data:
        items = []
        title = data.get("title", "").strip()
        if title:
            items.append({"id": str(uuid.uuid4()), "data": title, "done": False})
        for item in data.get("listContent", []):
            items.append({
                "id": str(uuid.uuid4()),
                "data": item["text"],
                "done": item.get("isChecked", False),
            })
        task_data = items
    else:
        title = data.get("title", "").strip()
        body = data.get("textContent", "").strip()
        if title and body:
            task_data = f"{title}\n{body}"
        elif title:
            task_data = title
        else:
            task_data = body

    return {
        "id": task_id,
        "data": task_data,
        "done": False,
        "pinned": pinned,
        "user_id": user_id,
        "image": img_filename,  # replaced with uploaded path before POST
    }


def upload_image(session, api_url, img_path):
    mime_type, _ = mimetypes.guess_type(str(img_path))
    mime_type = mime_type or "image/jpeg"
    with open(img_path, "rb") as f:
        resp = session.post(f"{api_url}/tasks/image", files={"upload": (img_path.name, f, mime_type)})
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Import Google Keep notes as tasks")
    parser.add_argument("src", help="Path to Keep export folder")
    parser.add_argument("--api-url", default="http://localhost:3000", help="Base URL of the tasks server (default: http://localhost:3000)")
    parser.add_argument("--username", help="Login username (prompted if omitted)")
    parser.add_argument("--password", help="Login password (prompted if omitted)")
    parser.add_argument("--user-id", type=int, default=1, help="User ID to assign to tasks (default: 1)")
    parser.add_argument("--limit", type=int, help="Max number of tasks to upload")
    parser.add_argument("--dry-run", action="store_true", help="Preview one file without uploading")
    parser.add_argument("--file", help="Specific file to use for --dry-run (relative to src or absolute)")
    args = parser.parse_args()

    src = Path(args.src)

    if args.dry_run:
        if args.file:
            candidate = Path(args.file)
            f = candidate if candidate.is_absolute() else src / candidate
        else:
            active = [
                f for f in src.glob("*.json")
                if not json.loads(f.read_text(encoding="utf-8")).get("isTrashed", False)
                and not json.loads(f.read_text(encoding="utf-8")).get("isArchived", False)
            ]
            if not active:
                print("No active notes found.", file=sys.stderr)
                sys.exit(1)
            f = random.choice(active)

        data = json.loads(f.read_text(encoding="utf-8"))
        task = convert_keep_to_task(data, args.user_id)
        print(f"=== Source: {f.name} ===")
        print("\n--- Keep (original) ---")
        print(json.dumps(data, indent=2))
        print("\n--- Task (converted) ---")
        print(json.dumps(task, indent=2))
        return

    # Login
    username = args.username or input("Username: ")
    password = args.password or getpass.getpass("Password: ")
    session = requests.Session()
    resp = session.post(f"{args.api_url}/users/login", json={"username": username, "password": password})
    resp.raise_for_status()
    print(f"Logged in as {username}")

    uploaded = 0
    skipped = 0

    if args.file:
        candidate = Path(args.file)
        files = [candidate if candidate.is_absolute() else src / candidate]
    else:
        files = list(src.glob("*.json"))

    active_files = [
        f for f in files
        if not json.loads(f.read_text(encoding="utf-8")).get("isTrashed", False)
        and not json.loads(f.read_text(encoding="utf-8")).get("isArchived", False)
    ]
    total = min(len(active_files), args.limit) if args.limit else len(active_files)
    print(f"Found {len(active_files)} active notes{f' (uploading {total})' if args.limit else ''}")

    for f in files:
        if args.limit and uploaded >= args.limit:
            break
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            if data.get("isTrashed", False) or data.get("isArchived", False):
                skipped += 1
                continue

            task = convert_keep_to_task(data, args.user_id)

            # Upload image if present
            if task["image"]:
                img_path = src / task["image"]
                if img_path.exists():
                    try:
                        task["image"] = upload_image(session, args.api_url, img_path)
                        print(f"  Uploaded image: {task['image']}")
                    except requests.HTTPError as e:
                        print(f"  Image upload failed: {e} — {e.response.text}", file=sys.stderr)
                        task["image"] = None
                else:
                    print(f"  Warning: image not found: {img_path.name}", file=sys.stderr)
                    task["image"] = None

            resp = session.post(f"{args.api_url}/tasks", json=task)
            resp.raise_for_status()
            uploaded += 1
            label = (task["data"][:60] if isinstance(task["data"], str) else f"[list, {len(task['data'])} items]")
            print(f"[{uploaded}] Uploaded: {label}")

        except Exception as e:
            print(f"Error processing {f.name}: {e}", file=sys.stderr)

    print(f"\nDone. Uploaded: {uploaded}, Skipped (trashed/archived): {skipped}")


if __name__ == "__main__":
    main()
