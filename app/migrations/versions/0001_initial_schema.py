"""Initial schema: users, lab_results, biomarkers, provenance, share_settings.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create the Phase 2 minimum tables and reserve pgvector for later phases."""
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("public_id", sa.String(length=32), nullable=False),
        sa.Column("seed_phrase_hash", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("seed_phrase_hash"),
    )
    op.create_index("ix_users_public_id", "users", ["public_id"], unique=True)

    op.create_table(
        "lab_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("collected_at", sa.Date(), nullable=True),
        sa.Column("lab_name", sa.String(length=255), nullable=True),
        sa.Column("chronological_age", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("parser_version", sa.String(length=64), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lab_results_user_id", "lab_results", ["user_id"])

    op.create_table(
        "biomarkers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lab_result_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("loinc_code", sa.String(length=32), nullable=True),
        sa.Column("raw_name", sa.String(length=255), nullable=False),
        sa.Column("canonical_name", sa.String(length=255), nullable=True),
        sa.Column("value", sa.Numeric(precision=14, scale=6), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=False),
        sa.Column("mapping_status", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "mapping_status IN ('mapped', 'unmapped')",
            name="ck_biomarkers_mapping_status",
        ),
        sa.ForeignKeyConstraint(["lab_result_id"], ["lab_results.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_biomarkers_lab_result_id", "biomarkers", ["lab_result_id"])
    op.create_index("ix_biomarkers_loinc_code", "biomarkers", ["loinc_code"])
    op.create_index("ix_biomarkers_mapping_status", "biomarkers", ["mapping_status"])

    op.create_table(
        "provenance",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lab_result_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entered_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_sha256", sa.String(length=64), nullable=False),
        sa.Column("parser_version", sa.String(length=64), nullable=False),
        sa.Column("lab_name", sa.String(length=255), nullable=True),
        sa.Column("collected_at", sa.Date(), nullable=True),
        sa.Column("confirmed", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["lab_result_id"], ["lab_results.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["entered_by_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lab_result_id"),
    )
    op.create_index("ix_provenance_document_sha256", "provenance", ["document_sha256"])

    op.create_table(
        "share_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )


def downgrade() -> None:
    """Drop Phase 2 tables. The vector extension is left installed."""
    op.drop_table("share_settings")
    op.drop_table("provenance")
    op.drop_table("biomarkers")
    op.drop_table("lab_results")
    op.drop_index("ix_users_public_id", table_name="users")
    op.drop_table("users")
