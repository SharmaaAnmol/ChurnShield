"""Shared feature step for the ChurnShield pipeline.

The model reads a customer's Brazilian state through its region (IBGE's five regions).
Per state, some groups were too small: none of the 370 Mato Grosso do Sul (MS) customers in the
training snapshots came back, so a state-level model gave every MS customer ~96%+ risk.
Regions pool those customers with their neighbours.

Kept in its own module so the saved pipeline (joblib) can be loaded by the backend and exporter.
"""
import numpy as np

STATE_TO_REGION = {
    **dict.fromkeys(["AC", "AM", "AP", "PA", "RO", "RR", "TO"], "North"),
    **dict.fromkeys(["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"], "Northeast"),
    **dict.fromkeys(["DF", "GO", "MS", "MT"], "Center-West"),
    **dict.fromkeys(["ES", "MG", "RJ", "SP"], "Southeast"),
    **dict.fromkeys(["PR", "RS", "SC"], "South"),
}


def state_to_region(X):
    """Map a column of state codes to region names; unknown codes become NaN (imputed later)."""
    a = np.asarray(X, dtype=object)
    return np.vectorize(lambda s: STATE_TO_REGION.get(s, np.nan), otypes=[object])(a)


assert len(STATE_TO_REGION) == 27
