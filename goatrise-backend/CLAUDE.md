# General
- **Language**: Respond in the same language used in the prompt.
- **Scope**: Execute EXACTLY what is requested. Do not assume or add anything extra.
- **Code Modification**: Only replace the specific code segments that require changes. Do not rewrite or overwrite the entire file to prevent unintended modifications.
- **Context Verification**: Always inspect the current codebase before performing a task; do not rely on memory.
- **Post-Task Review**: After execution, always confirm the actions taken and provide an objective critique (strengths, weaknesses, areas for improvement, etc.).

# Project
- **Semicolons**: Always use `;`
- **Services Layout**: Always put the getSomethingById functions to the very top
- **General File Layout**: Always put the private functions (not export) to the bottom
- **DB Dependency Injection**: Every impure function (one that touches the database) must receive `db: DbExec` (from `core/db.ts`) as its first parameter instead of importing the global `db`; callers pass the global `db` or a transaction `tx`. This keeps pure functions clearly separated from impure ones and lets write-paths compose everything into a single transaction.