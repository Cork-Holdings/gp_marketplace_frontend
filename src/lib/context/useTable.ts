import { useContext } from 'react';
import { TableContext } from './TableContext';

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTable must be used within TableProvider');
  return ctx;
}
