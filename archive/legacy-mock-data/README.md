# Archived legacy mock data

Archived on 6 October 2026 from `src/lib/mockData`.

These three files are preserved for reference, not used by the application. A source-tree search found no consumers outside the mock directory. They import missing `mockClient` and `tables.mock` modules and prevented the production source tree from passing TypeScript checking.

Current catalogue, categories, modifiers and tables use the API service modules under `src/lib/api/services`; no mock fallback was added. Restore or migrate these fixtures only with their missing dependencies and explicit tests. This archive is not a runnable simulation or evidence that payments work.
