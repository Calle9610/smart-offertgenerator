"""Fixed initial migration - matches actual models

Revision ID: 001_fixed
Revises:
Create Date: 2025-08-12 23:00:00.000000

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "001_fixed"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all tables with correct schema from the start."""

    # Create tenant table first (needed for foreign keys)
    op.create_table(
        "tenant",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("domain", sa.String(), unique=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create company table with tenant_id from the start
    op.create_table(
        "company",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
    )

    # Create user table
    op.create_table(
        "user",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("username", sa.String(), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String()),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("is_superuser", sa.Boolean(), default=False),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
    )

    # Create price_profile table
    op.create_table(
        "price_profile",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, default="SEK"),
        sa.Column(
            "vat_rate", sa.Numeric(precision=5, scale=2), nullable=False, default=25.00
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
    )

    # Create labor_rate table
    op.create_table(
        "labor_rate",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True)),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("description", sa.String()),
        sa.Column("unit", sa.String(), nullable=False, default="hour"),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
        sa.ForeignKeyConstraint(["profile_id"], ["price_profile.id"]),
    )

    # Create material table
    op.create_table(
        "material",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True)),
        sa.Column("sku", sa.String()),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("unit", sa.String(), nullable=False, default="pcs"),
        sa.Column("unit_cost", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "markup_pct",
            sa.Numeric(precision=6, scale=2),
            nullable=False,
            default=20.00,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
        sa.ForeignKeyConstraint(["profile_id"], ["price_profile.id"]),
    )

    # Create quote table with all required fields
    op.create_table(
        "quote",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("project_name", sa.String()),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, default="SEK"),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), server_default="0"),
        sa.Column("vat", sa.Numeric(precision=12, scale=2), server_default="0"),
        sa.Column("total", sa.Numeric(precision=12, scale=2), server_default="0"),
        sa.Column("status", sa.String(), server_default="draft", nullable=False),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["profile_id"], ["price_profile.id"]),
    )

    # Create quote_item table
    op.create_table(
        "quote_item",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quote_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("ref", sa.String()),
        sa.Column("description", sa.String()),
        sa.Column("qty", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("unit", sa.String()),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("line_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["quote_id"], ["quote.id"], ondelete="CASCADE"),
    )

    # Create project_requirements table
    op.create_table(
        "project_requirements",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quote_id", postgresql.UUID(as_uuid=True)),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
        sa.ForeignKeyConstraint(["quote_id"], ["quote.id"]),
    )

    # Create generation_rule table
    op.create_table(
        "generation_rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("rules", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
    )

    # Create quote_adjustment_log table
    op.create_table(
        "quote_adjustment_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quote_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_ref", sa.String()),
        sa.Column("original_qty", sa.Numeric(precision=12, scale=2)),
        sa.Column("new_qty", sa.Numeric(precision=12, scale=2)),
        sa.Column("change_reason", sa.String()),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["quote_id"], ["quote.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
    )


def downgrade() -> None:
    """Drop all tables in reverse order."""
    op.drop_table("quote_adjustment_log")
    op.drop_table("generation_rule")
    op.drop_table("project_requirements")
    op.drop_table("quote_item")
    op.drop_table("quote")
    op.drop_table("material")
    op.drop_table("labor_rate")
    op.drop_table("price_profile")
    op.drop_table("user")
    op.drop_table("company")
    op.drop_table("tenant")
