"""AST-based locator for identifying code sites using affected payload fields."""

import ast

from pydantic import BaseModel


class CodeSite(BaseModel):
    """Specific source code location accessing a drifting payload attribute."""

    file_path: str
    line_number: int
    key_name: str
    context_line: str


class _PayloadAccessVisitor(ast.NodeVisitor):
    """AST visitor searching for dictionary subscript lookups matching keys."""

    def __init__(self, target_keys: set[str], lines: list[str], file_path: str) -> None:
        self.target_keys = target_keys
        self.lines = lines
        self.file_path = file_path
        self.matches: list[CodeSite] = []

    def visit_Subscript(self, node: ast.Subscript) -> None:
        """Inspect dictionary subscript access like payload['amount_in_cents']."""
        if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, str):
            key = node.slice.value
            if key in self.target_keys:
                line_idx = getattr(node, "lineno", 1) - 1
                context = self.lines[line_idx].strip() if line_idx < len(self.lines) else ""
                self.matches.append(
                    CodeSite(
                        file_path=self.file_path,
                        line_number=line_idx + 1,
                        key_name=key,
                        context_line=context,
                    )
                )
        self.generic_visit(node)


def locate_field_usages(
    source_code: str,
    target_keys: list[str],
    file_path: str = "service.py",
) -> list[CodeSite]:
    """Parse source code via AST and return all code sites accessing the target keys."""
    if not source_code.strip() or not target_keys:
        return []

    try:
        tree = ast.parse(source_code)
    except SyntaxError:
        return []

    lines = source_code.splitlines()
    visitor = _PayloadAccessVisitor(set(target_keys), lines, file_path)
    visitor.visit(tree)
    return visitor.matches
