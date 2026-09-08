import hashlib

import pandas as pd
import pytest

from scripts.expand_movie_catalog import file_md5, validate_catalog


def test_file_md5_matches_known_content(tmp_path):
    source = tmp_path / "sample.csv"
    source.write_bytes(b"movieId,title,genres\n1,Example,Drama\n")

    assert file_md5(source) == hashlib.md5(source.read_bytes(), usedforsecurity=False).hexdigest()


def test_expanded_catalog_rejects_reserved_iranian_id_range(tmp_path):
    source = tmp_path / "movies.csv"
    pd.DataFrame(
        [(1_000_000, "Conflicting movie (2024)", "Drama")],
        columns=["movieId", "title", "genres"],
    ).to_csv(source, index=False)

    with pytest.raises(ValueError, match="reserved Iranian catalog range"):
        validate_catalog(source)
