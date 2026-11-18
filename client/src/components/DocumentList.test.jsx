import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import DocumentList from './DocumentList';

const doc = (over) => ({ id: '1', title: 'Plan', snippet: 'hello', role: 'owner', owner: { name: 'Alice' }, updatedAt: '2026-01-01T00:00:00Z', ...over });
const renderList = (props) => render(<MemoryRouter><DocumentList emptyText="nothing here" {...props} /></MemoryRouter>);

describe('DocumentList', () => {
  test('shows the empty state', () => {
    renderList({ documents: [] });
    expect(screen.getByText('nothing here')).toBeInTheDocument();
  });

  test('distinguishes roles and only offers delete on owned docs', () => {
    renderList({
      documents: [doc({ id: '1', title: 'Mine' }), doc({ id: '2', title: 'Theirs', role: 'viewer' })],
      onDelete: vi.fn(),
      showOwner: true,
    });
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('View only')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Mine')).toBeInTheDocument();
    expect(screen.queryByLabelText('Delete Theirs')).not.toBeInTheDocument();
  });
});
