"""Pydantic models for structured, deterministic patch plans.

The Coder agent and Learned Pattern engine both output PatchPlans.
"""

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field


class RenameKeyAction(BaseModel):
    """Normalize a renamed key to the expected legacy key."""

    action_type: Literal["rename_key"] = "rename_key"
    target_path: str
    source_path: str


class CoerceTypeAction(BaseModel):
    """Coerce and rescale numeric types (e.g. decimal string to paise integer)."""

    action_type: Literal["coerce_type"] = "coerce_type"
    target_path: str
    source_path: str
    target_type: Literal["int", "float", "str"] = "int"
    scale_factor: float = 1.0


class RemapPathAction(BaseModel):
    """Relocate nested or restructured payload paths."""

    action_type: Literal["remap_path"] = "remap_path"
    target_path: str
    source_path: str


class AddDefaultAction(BaseModel):
    """Inject a default value when a field is missing."""

    action_type: Literal["add_default"] = "add_default"
    target_path: str
    default_value: Any


PatchAction = Annotated[
    RenameKeyAction | CoerceTypeAction | RemapPathAction | AddDefaultAction,
    Field(discriminator="action_type"),
]


class PatchPlan(BaseModel):
    """Executable declarative patch specification."""

    scenario: Literal["rename", "type", "nested"]
    summary: str
    target_file: str = "service.py"
    actions: list[PatchAction]
