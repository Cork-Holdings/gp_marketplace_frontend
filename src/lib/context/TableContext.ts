import { createContext } from 'react';
import type { Table } from '@/types/table';

export interface TableContextValue {
  tables: Table[];
  loading: boolean;
  error: unknown;
  loadTables: () => Promise<void>;
  createTable: (payload: Partial<Table>) => Promise<Table>;
  updateTable: (tableId: string, payload: Partial<Table>) => Promise<Table>;
  deleteTable: (tableId: string) => Promise<void>;
  setTableStatus: (tableId: string, status: Table['status']) => Promise<Table>;
}

export const TableContext = createContext<TableContextValue | null>(null);

export default TableContext;
