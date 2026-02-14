"""Add product_type and history

Revision ID: 3427166d8b2c
Revises: 1dcf57b0b57c
Create Date: 2026-02-12 19:41:23.875706

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '3427166d8b2c'
down_revision: Union[str, Sequence[str], None] = '1dcf57b0b57c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('trades', sa.Column('product_type', sa.String(), server_default='DELIVERY', nullable=True))


def downgrade() -> None:
    op.drop_column('trades', 'product_type')
