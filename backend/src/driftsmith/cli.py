"""Command-line interface for DriftSmith using Typer."""

import typer
from rich.console import Console

from driftsmith.db.repositories import runs as runs_repo
from driftsmith.db.session import SessionLocal, init_db
from driftsmith.services.run_service import trigger_remediation_run

app = typer.Typer(
    name="driftsmith",
    help="Autonomous self-healing remediation engine for third-party API drift",
)
console = Console()


@app.command("heal")
def heal(
    scenario: str = typer.Option(
        "rename", "--scenario", "-s", help="Drift scenario: rename, type, or nested"
    ),
    service: str = typer.Option("payment-gateway", "--service", help="Target service identifier"),
) -> None:
    """Run an end-to-end self-healing remediation pipeline."""
    init_db()
    console.print(
        f"[bold cyan]DriftSmith Healing Agent[/bold cyan] starting for [yellow]{service}[/yellow] ({scenario} drift)..."
    )

    run_id = trigger_remediation_run(
        scenario=scenario,  # type: ignore[arg-type]
        service_name=service,
        source="manual",
        sync=True,
    )

    with SessionLocal() as db:
        run = runs_repo.get_run(db, run_id)
        if not run:
            console.print(f"[red]Error:[/red] Run {run_id} could not be retrieved.")
            raise typer.Exit(code=1)

        detail = runs_repo.to_detail_schema(run)
        if detail.status in ("awaiting_approval", "verified"):
            console.print(
                f"[bold green]Success![/bold green] Run {run_id} healed with status: [green]{detail.status}[/green]"
            )
            console.print(f"  Confidence: {detail.confidence:.0%}")
            console.print(f"  Healed from memory: {detail.healed_from_memory}")
            console.print(f"  LLM calls: {detail.llm_calls}")
            console.print(f"  Iterations: {detail.iterations}")
            if detail.pull_request:
                console.print(f"  Pull Request Branch: [cyan]{detail.pull_request.branch}[/cyan]")
        else:
            console.print(
                f"[bold red]Failed![/bold red] Run {run_id} finished with status: [red]{detail.status}[/red]"
            )
            raise typer.Exit(code=1)


@app.command("version")
def version() -> None:
    """Print DriftSmith CLI version."""
    console.print("DriftSmith CLI v0.1.0")


if __name__ == "__main__":
    app()
