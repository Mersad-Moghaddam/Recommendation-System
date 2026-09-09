from types import SimpleNamespace

from backend.constants import MOVIE_DETAIL_COPY
from backend.movie_details import build_movie_details, split_title


def test_split_title_extracts_trailing_year():
    assert split_title("Arrival (2016)") == ("Arrival", 2016)
    assert split_title("No Year") == ("No Year", None)


def test_movie_details_preserve_real_metadata_and_rating():
    movie = SimpleNamespace(id=1, title="Arrival (2016)", genres="Drama|Sci-Fi")
    details = build_movie_details(movie, 4.125, 24)

    assert details["display_title"] == "Arrival"
    assert details["year"] == 2016
    assert details["genres"] == ["Drama", "Sci-Fi"]
    assert details["rating_average"] == 4.12
    assert details["rating_count"] == 24
    assert details["data_note"] == MOVIE_DETAIL_COPY["data_note_fallback"]
    assert details["overview_short"] is None


def test_movie_details_identify_local_persian_catalog():
    movie = SimpleNamespace(id=1_000_001, title="Sample (2022)", genres="Drama")
    details = build_movie_details(movie, None, 0)

    assert details["is_persian"] is True
    assert details["source"] == MOVIE_DETAIL_COPY["source_persian"]
    assert details["community_note"] == MOVIE_DETAIL_COPY["no_ratings"]
