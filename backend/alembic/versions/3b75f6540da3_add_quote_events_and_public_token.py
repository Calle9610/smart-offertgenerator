"""add_quote_events_and_public_token

Revision ID: 3b75f6540da3
Revises: 001_fixed
Create Date: 2025-08-13 12:47:24.380818

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
import secrets


# revision identifiers, used by Alembic.
revision = '3b75f6540da3'
down_revision = '001_fixed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add public_token column to quote table
    op.add_column('quote', sa.Column('public_token', sa.String(64), unique=True))
    
    # Create quote_event table
    op.create_table('quote_event',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('meta', postgresql.JSONB(), server_default='{}'),
        sa.ForeignKeyConstraint(['quote_id'], ['quote.id'], ondelete='CASCADE'),
        sa.CheckConstraint("type IN ('sent', 'opened', 'accepted', 'declined')", name='valid_event_type')
    )
    
    # Create index on (quote_id, type, created_at)
    op.create_index('ix_quote_event_quote_id_type_created_at', 'quote_event', ['quote_id', 'type', 'created_at'])
    
    # Backfill public_token for existing quotes
    connection = op.get_bind()
    quotes = connection.execute(sa.text("SELECT id FROM quote WHERE public_token IS NULL"))
    
    for quote in quotes:
        # Generate 32-character hex token
        token = secrets.token_hex(16)
        connection.execute(
            sa.text("UPDATE quote SET public_token = :token WHERE id = :id"),
            {"token": token, "id": quote[0]}
        )


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_quote_event_quote_id_type_created_at', 'quote_event')
    
    # Drop quote_event table
    op.drop_table('quote_event')
    
    # Drop public_token column from quote table
    op.drop_column('quote', 'public_token') 
