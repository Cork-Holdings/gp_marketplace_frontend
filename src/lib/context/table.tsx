import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { ownerApi } from '@/lib/api/services';
import { normalizeTableList } from '@/lib/normalizeApi';
import { TableContext, type TableContextValue } from './TableContext';
import type { Table } from '@/types/table';

export function TableProvider({ children, storeId }: { children: ReactNode; storeId: string | null | undefined }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadTables = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await ownerApi.listTables(storeId);
      setTables(normalizeTableList(data));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const createTable = useCallback(
    async (payload: Partial<Table>) => {
      if (!storeId) throw new Error('No store selected');
      const table = await ownerApi.createTable(storeId, payload);
      await loadTables();
      return table;
    },
    [storeId, loadTables],
  );

  const updateTable = useCallback(
    async (tableId: string, payload: Partial<Table>) => {
      if (!storeId) throw new Error('No store selected');
      const table = await ownerApi.updateTable(storeId, tableId, payload);
      await loadTables();
      return table;
    },
    [storeId, loadTables],
  );

  const deleteTable = useCallback(
    async (tableId: string) => {
      if (!storeId) throw new Error('No store selected');
      await ownerApi.deleteTable(storeId, tableId);
      await loadTables();
    },
    [storeId, loadTables],
  );

  const setTableStatus = useCallback(
    (tableId: string, status: Table['status']) => updateTable(tableId, { status }),
    [updateTable],
  );

  const value = useMemo<TableContextValue>(
    () => ({ tables, loading, error, loadTables, createTable, updateTable, deleteTable, setTableStatus }),
    [tables, loading, error, loadTables, createTable, updateTable, deleteTable, setTableStatus],
  );

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}
