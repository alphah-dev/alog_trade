"""initial

Revision ID: 1dcf57b0b57c
Revises: 
Create Date: 2026-02-11 22:39:06.595277

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1dcf57b0b57c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('portfolio',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('symbol', sa.String(), nullable=False),
    sa.Column('average_price', sa.Float(), nullable=False),
    sa.Column('total_quantity', sa.Float(), nullable=False),
    sa.Column('last_updated', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_portfolio_id'), 'portfolio', ['id'], unique=False)
    op.create_index(op.f('ix_portfolio_symbol'), 'portfolio', ['symbol'], unique=True)
    op.create_table('trades',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('symbol', sa.String(), nullable=False),
    sa.Column('side', sa.String(), nullable=False),
    sa.Column('price', sa.Float(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('timestamp', sa.DateTime(), nullable=True),
    sa.Column('strategy_name', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trades_id'), 'trades', ['id'], unique=False)
    op.create_index(op.f('ix_trades_symbol'), 'trades', ['symbol'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_trades_symbol'), table_name='trades')
    op.drop_index(op.f('ix_trades_id'), table_name='trades')
    op.drop_table('trades')
    op.drop_index(op.f('ix_portfolio_symbol'), table_name='portfolio')
    op.drop_index(op.f('ix_portfolio_id'), table_name='portfolio')
    op.drop_table('portfolio')
