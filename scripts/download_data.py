"""Download the official MovieLens latest-small classroom dataset."""
from pathlib import Path
from urllib.request import urlretrieve
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
url = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
archive = ROOT / "data" / "ml-latest-small.zip"
target = ROOT / "data" / "raw"
target.mkdir(parents=True, exist_ok=True)
print("Downloading MovieLens latest-small...")
urlretrieve(url, archive)
with ZipFile(archive) as zf:
    for name in ("movies.csv", "ratings.csv", "README.txt"):
        source = f"ml-latest-small/{name}"
        with zf.open(source) as src, (target / name).open("wb") as dst:
            dst.write(src.read())
archive.unlink()
print(f"Dataset ready in {target}")
