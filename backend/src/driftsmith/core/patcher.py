"""Deterministic AST/CST code patcher with dual-payload backward compatibility.

Uses libcst to generate non-destructive, verifiable code patches.
"""

import difflib

import libcst as cst

from driftsmith.core.patch_plan import (
    CoerceTypeAction,
    PatchPlan,
    RemapPathAction,
    RenameKeyAction,
)


class _DualCompatTransformer(cst.CSTTransformer):
    """libcst transformer substituting brittle payload accesses with dual-compat expressions."""

    def __init__(self, plan: PatchPlan) -> None:
        self.plan = plan

    def leave_Subscript(
        self, original_node: cst.Subscript, updated_node: cst.Subscript
    ) -> cst.BaseExpression:
        """Transform single and nested dictionary subscript lookups."""
        # Check nested subscript: payload["customer"]["email"]
        if (
            isinstance(original_node.value, cst.Subscript)
            and isinstance(original_node.slice[0].slice, cst.Index)
            and isinstance(original_node.slice[0].slice.value, cst.SimpleString)
        ):
            outer_key = original_node.slice[0].slice.value.evaluated_value
            inner_sub = original_node.value
            if isinstance(inner_sub.slice[0].slice, cst.Index) and isinstance(
                inner_sub.slice[0].slice.value, cst.SimpleString
            ):
                inner_key = inner_sub.slice[0].slice.value.evaluated_value
                full_path = f"{inner_key}.{outer_key}"
                for action in self.plan.actions:
                    if isinstance(action, RemapPathAction) and action.target_path == full_path:
                        src_parts = action.source_path.split(".")
                        src_expr = "payload"
                        for part in src_parts[:-1]:
                            src_expr += f'.get("{part}", {{}})'
                        src_expr += f'.get("{src_parts[-1]}")'
                        code = (
                            f'(payload.get("{inner_key}", {{}}).get("{outer_key}") '
                            f'if "{inner_key}" in payload else {src_expr})'
                        )
                        return cst.parse_expression(code)

        # Check top-level subscript: payload["amount_in_cents"]
        if isinstance(original_node.slice[0].slice, cst.Index) and isinstance(
            original_node.slice[0].slice.value, cst.SimpleString
        ):
            key = original_node.slice[0].slice.value.evaluated_value
            for action in self.plan.actions:
                if isinstance(action, RenameKeyAction) and action.target_path == key:
                    code = (
                        f'payload.get("{action.target_path}") if "{action.target_path}" '
                        f'in payload else payload.get("{action.source_path}")'
                    )
                    return cst.parse_expression(code)

                if isinstance(action, CoerceTypeAction) and action.target_path == key:
                    scale = (
                        int(action.scale_factor)
                        if action.scale_factor.is_integer()
                        else action.scale_factor
                    )
                    code = (
                        f'(int(round(float(payload["{action.source_path}"]) * {scale})) '
                        f'if "{action.source_path}" in payload '
                        f'else payload.get("{action.target_path}"))'
                    )
                    return cst.parse_expression(code)

        return updated_node


def apply_patch_plan(
    source_code: str,
    plan: PatchPlan,
    file_path: str = "service.py",
) -> tuple[str, str]:
    """Apply PatchPlan to source code via libcst and return (patched_code, diff_text)."""
    module = cst.parse_module(source_code)
    transformer = _DualCompatTransformer(plan)
    modified_module = module.visit(transformer)
    patched_code = modified_module.code

    diff_lines = list(
        difflib.unified_diff(
            source_code.splitlines(keepends=True),
            patched_code.splitlines(keepends=True),
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
        )
    )
    diff_text = "".join(diff_lines)

    return patched_code, diff_text
