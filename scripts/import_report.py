#!/usr/bin/env python3
"""Import a completed run descriptor and Buckyball Perfetto cycle traces."""
import argparse
from bisect import bisect_right
import fcntl
import json
import math
import re
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATUSES = {"pass", "fail", "timeout", "infra_error"}
CATEGORIES = {"Conv", "MatMul", "Transfer", "Quantization", "Activation", "Pool", "Other"}


def report_directory(run):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", run["chip"]):
        raise ValueError("chip must be a safe directory name")
    timestamp = datetime.fromisoformat(run["timestamp"].replace("Z", "+00:00"))
    if timestamp.utcoffset() is None:
        raise ValueError("timestamp must include a timezone")
    folder = timestamp.astimezone(timezone.utc).strftime("%Y-%m-%d-%H-%M")
    return Path(run["chip"]) / folder


def nonempty(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} must be a non-empty string")
    return value


def number(value, label, *, positive=False, integer=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{label} must be a finite number")
    if value < 0 or (positive and value == 0) or (integer and (value != int(value) or value > 2**53 - 1)):
        raise ValueError(f"invalid {label}: {value}")
    return value


def parse_trace(data, categories):
    events = data["traceEvents"]
    groups = {}
    for event in events:
        if event.get("ph") != "X" or event.get("cat") != "buddy.trace":
            continue
        args = event["args"]
        path = args["id_path"]
        if not isinstance(path, list) or not path:
            raise ValueError("trace id_path must be a non-empty list")
        for part in path:
            number(part, "trace id", integer=True)
        identity = "-".join(str(int(part)) for part in path)
        start = number(args["start_cycle"], "start_cycle", integer=True)
        end = number(args["end_cycle"], "end_cycle", integer=True)
        elapsed = number(args["elapsed_cycle"], "elapsed_cycle", integer=True)
        if end < start or end - start != elapsed or event["dur"] != elapsed:
            raise ValueError(f"inconsistent cycle interval for {identity}")
        name = nonempty(event["name"], "operator name")
        category = categories.get(name, "Other")
        if category not in CATEGORIES:
            raise ValueError(f"unknown operator category: {category}")
        groups.setdefault(identity, []).append({
            "id": identity, "name": name, "category": category,
            "cycles": int(elapsed), "start_cycle": int(start),
            "level": len(path) - 1,
        })
    if not groups:
        raise ValueError("no buddy.trace cycle intervals found")
    starts = {}
    for identity, records in groups.items():
        records.sort(key=lambda op: op["start_cycle"])
        starts[identity] = [op["start_cycle"] for op in records]
        for previous, current in zip(records, records[1:]):
            if previous["name"] != current["name"]:
                raise ValueError(f"trace id has inconsistent names: {identity}")
            if previous["start_cycle"] + previous["cycles"] > current["start_cycle"]:
                raise ValueError(f"overlapping calls of trace {identity}")
    for identity, records in groups.items():
        parts = identity.split("-")
        if len(parts) > 1:
            parent_id = "-".join(parts[:-1])
            if parent_id not in groups:
                raise ValueError(f"missing parent for trace {identity}")
            for op in records:
                index = bisect_right(starts[parent_id], op["start_cycle"]) - 1
                if index < 0:
                    raise ValueError(f"nested trace outside parent: {identity}")
                parent = groups[parent_id][index]
                if op["start_cycle"] + op["cycles"] > parent["start_cycle"] + parent["cycles"]:
                    raise ValueError(f"nested trace outside parent: {identity}")
    start = min(records[0]["start_cycle"] for records in groups.values())
    end = max(records[-1]["start_cycle"] + records[-1]["cycles"] for records in groups.values())
    if start == end:
        raise ValueError("trace span must be positive")
    operators = []
    for records in groups.values():
        op = dict(records[0])
        op["cycles"] = sum(record["cycles"] for record in records)
        op["calls"] = len(records)
        op["start_cycle"] -= start
        operators.append(op)
    return int(end - start), operators


def validate_run(run):
    if run["schema_version"] != 1:
        raise ValueError("invalid schema_version")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", run["id"]):
        raise ValueError("run id must be a safe file name")
    stamp = datetime.fromisoformat(run["timestamp"].replace("Z", "+00:00"))
    if stamp.utcoffset() is None:
        raise ValueError("timestamp must include a timezone")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", run["repository"]):
        raise ValueError("repository must be owner/name")
    if not re.fullmatch(r"[0-9a-f]{40}", run["commit"]):
        raise ValueError("commit must be a full 40-character SHA")
    for key in ("branch", "chip", "backend", "config_hash"):
        nonempty(run[key], key)
    number(run["clock_hz"], "clock_hz", positive=True)
    if not run["models"]:
        raise ValueError("a run must contain model results")
    names = set()
    for model in run["models"]:
        name = nonempty(model["name"], "model name")
        if name in names:
            raise ValueError(f"duplicate model: {name}")
        names.add(name)
        for key in ("workload_hash", "dataset_hash"):
            nonempty(model[key], key)
        if model["status"] not in STATUSES:
            raise ValueError(f"unknown status: {model['status']}")
        if model["accuracy"] is not None:
            accuracy = number(model["accuracy"], "accuracy")
            if accuracy > 1:
                raise ValueError("accuracy must be in [0,1]")
            nonempty(model["accuracy_metric"], "accuracy_metric")
        if model["status"] == "pass":
            number(model["cycles"], "cycles", positive=True, integer=True)
            if not model["operators"] or not any(op["cycles"] for op in model["operators"]):
                raise ValueError("passing model must have operator traces")
            if model["error"] is not None:
                raise ValueError("passing model cannot contain an error")
        else:
            nonempty(model["error"], "model error")
            if model["cycles"] is not None or model["operators"]:
                raise ValueError("failed models cannot contain performance measurements")
        ids = set()
        for op in model["operators"]:
            nonempty(op["id"], "operator id")
            nonempty(op["name"], "operator name")
            if op["id"] in ids:
                raise ValueError("duplicate operator id")
            ids.add(op["id"])
            if op["category"] not in CATEGORIES:
                raise ValueError("unknown operator category")
            for key in ("cycles", "start_cycle", "level"):
                number(op[key], key, integer=True)
            number(op["calls"], "calls", positive=True, integer=True)
            if op["start_cycle"] + op["cycles"] > model["cycles"]:
                raise ValueError("operator interval exceeds model trace span")
    return run


def import_report(descriptor, data_root):
    data_root.mkdir(parents=True, exist_ok=True)
    with (data_root / ".import.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        return _import_report(descriptor, data_root)


def _import_report(descriptor, data_root):
    source = json.loads(descriptor.read_text())
    run = {key: source[key] for key in ("id", "timestamp", "repository", "branch", "commit",
                                       "chip", "backend", "config_hash", "clock_hz")}
    run.update(schema_version=1, models=[])
    if "provenance" in source:
        run["provenance"] = source["provenance"]
    directory = report_directory(run)
    trace_files = []
    for index, spec in enumerate(source["models"]):
        model = {key: spec[key] for key in ("name", "status", "workload_hash", "dataset_hash")}
        model.update(accuracy=spec.get("accuracy"), accuracy_metric=spec.get("accuracy_metric"),
                     error=spec.get("error"), trace_url=None, cycles=None, operators=[])
        if model["status"] == "pass":
            trace_path = (descriptor.parent / spec["trace_file"]).resolve()
            model["cycles"], model["operators"] = parse_trace(json.loads(trace_path.read_text()), spec.get("operator_categories", {}))
            filename = f"model-{index}-perfetto.json"
            model["trace_url"] = f"data/{directory.as_posix()}/{filename}"
            trace_files.append((trace_path, filename))
        run["models"].append(model)
    validate_run(run)
    data_root.mkdir(parents=True, exist_ok=True)
    index_path = data_root / "index.json"
    index = json.loads(index_path.read_text())
    if index["schema_version"] != 1:
        raise ValueError("unsupported index version")
    target = data_root / directory
    entry = f"{directory.as_posix()}/report.json"
    if target.exists() or entry in index["runs"]:
        raise FileExistsError(f"report directory already exists: {directory}")
    for existing in index["runs"]:
        if json.loads((data_root / existing).read_text())["id"] == run["id"]:
            raise FileExistsError(f"run already exists: {run['id']}")
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target.parent) as temporary:
        staging = Path(temporary) / "report"
        staging.mkdir()
        (staging / "report.json").write_text(json.dumps(run, indent=2) + "\n")
        for trace_path, filename in trace_files:
            shutil.copyfile(trace_path, staging / filename)
        staging.rename(target)
    index["runs"].append(entry)
    with tempfile.NamedTemporaryFile(mode="w", dir=data_root, delete=False) as handle:
        json.dump(index, handle, indent=2)
        handle.write("\n")
        staged_index = Path(handle.name)
    staged_index.replace(index_path)
    return run


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("descriptor", type=Path)
    parser.add_argument("--data-root", type=Path, default=ROOT / "public/data")
    options = parser.parse_args()
    report = import_report(options.descriptor.resolve(), options.data_root.resolve())
    print(f"Imported {report['id']}: {len(report['models'])} model results")
