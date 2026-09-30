#!/usr/bin/env python3
import json
from pathlib import Path
from import_report import ROOT, report_directory, validate_run


def validate_index(data_root, index_path, demo):
    index = json.loads(index_path.read_text())
    if index["schema_version"] != 1 or len(set(index["runs"])) != len(index["runs"]):
        raise ValueError(f"invalid index: {index_path}")
    ids = set()
    for relative in index["runs"]:
        path = (data_root / relative).resolve()
        if not path.is_relative_to(data_root.resolve()):
            raise ValueError("report path escapes data directory")
        run = validate_run(json.loads(path.read_text()))
        archive_root = data_root / "demo" if demo else data_root
        if path != (archive_root / report_directory(run) / "report.json").resolve():
            raise ValueError("report must be stored under chip/YYYY-MM-DD-HH-MM")
        if run["demo"] != demo or run["id"] in ids:
            raise ValueError("mixed dataset or duplicate run id")
        ids.add(run["id"])
        for model in run["models"]:
            if model["trace_url"] is not None:
                trace = (ROOT / "public" / model["trace_url"]).resolve()
                if not trace.is_relative_to(data_root.resolve()) or not trace.is_file():
                    raise ValueError("missing or invalid trace download")
    return len(ids)


if __name__ == "__main__":
    root = ROOT / "public/data"
    actual = validate_index(root, root / "index.json", False)
    demo = validate_index(root, root / "demo/index.json", True)
    print(f"Validated {actual} recorded runs and {demo} demo runs")
