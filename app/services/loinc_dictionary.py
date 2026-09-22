"""Load the versioned LOINC dictionary from package data."""

from __future__ import annotations

import json
from functools import lru_cache
from importlib.resources import files

from app.domain.loinc import LoincDictionary, LoincDictionaryError

_DICTIONARY_PATH = "loinc/dictionary.v1.json"
_LICENSE_PATH = "loinc/LICENSE"


@lru_cache(maxsize=1)
def load_loinc_dictionary() -> LoincDictionary:
    """Read and validate the packaged CC-BY-4.0 LOINC dictionary.

    Raises:
        LoincDictionaryError: The license notice or document failed validation.
    """
    root = files("app.data")
    license_text = root.joinpath(_LICENSE_PATH).read_text(encoding="utf-8")
    if "CC-BY-4.0" not in license_text:
        raise LoincDictionaryError("Dictionary license file must name CC-BY-4.0")
    raw: object = json.loads(root.joinpath(_DICTIONARY_PATH).read_text(encoding="utf-8"))
    return LoincDictionary.from_payload(raw)
