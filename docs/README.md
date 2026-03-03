# COBOL Student Account System Documentation

## Overview

This COBOL application is a simple student account management system that supports:

- Viewing the current account balance
- Crediting (adding funds to) the account
- Debiting (subtracting funds from) the account with an insufficient-funds check

The system is organized into three programs under `src/cobol`:

- `main.cob` (menu and user interaction)
- `operations.cob` (business transaction processing)
- `data.cob` (in-memory data access layer)

## File-by-File Purpose

### `src/cobol/main.cob` — MainProgram

**Purpose:**

- Acts as the application entry point and interactive menu loop.
- Captures user choices and routes requests to the operations module.

**Key logic:**

- Displays a menu with four options:
  1. View Balance
  2. Credit Account
  3. Debit Account
  4. Exit
- Uses `EVALUATE USER-CHOICE` to dispatch calls:
  - `CALL 'Operations' USING 'TOTAL '`
  - `CALL 'Operations' USING 'CREDIT'`
  - `CALL 'Operations' USING 'DEBIT '`
- Repeats until option 4 sets `CONTINUE-FLAG` to `NO`.
- Handles invalid input by displaying an error message.

### `src/cobol/operations.cob` — Operations

**Purpose:**

- Implements account transaction behavior (balance inquiry, credit, debit).
- Applies core business rules around balance updates.

**Key logic/functions by operation type:**

- `TOTAL `:
  - Reads current balance from `DataProgram` using `READ`.
  - Displays the current balance.
- `CREDIT`:
  - Prompts for credit amount.
  - Reads current balance from `DataProgram`.
  - Adds amount to balance.
  - Persists updated balance via `DataProgram` using `WRITE`.
  - Displays new balance.
- `DEBIT `:
  - Prompts for debit amount.
  - Reads current balance from `DataProgram`.
  - Checks if `FINAL-BALANCE >= AMOUNT`.
  - If true, subtracts amount, writes updated balance, and displays new balance.
  - If false, displays an insufficient-funds message and does not update balance.

### `src/cobol/data.cob` — DataProgram

**Purpose:**

- Centralizes balance storage and data access operations.
- Provides a simple `READ`/`WRITE` interface to the shared balance.

**Key logic/functions:**

- Maintains `STORAGE-BALANCE` in working storage (initialized to `1000.00`).
- Accepts operation and balance via linkage:
  - `READ` → moves `STORAGE-BALANCE` to caller balance field.
  - `WRITE` → moves caller balance field into `STORAGE-BALANCE`.

## Key Business Rules for Student Accounts

1. **Single account balance model**
   - The current implementation manages one shared student account balance in memory (`STORAGE-BALANCE`).

2. **Initial balance**
   - Balance starts at `1000.00` at program initialization.

3. **View balance is read-only**
   - `TOTAL ` only reads and displays; it does not modify data.

4. **Credits always increase balance**
   - `CREDIT` adds the entered amount to the current balance and persists it.

5. **Debits cannot overdraw account**
   - `DEBIT ` is allowed only when current balance is greater than or equal to the requested amount.
   - If funds are insufficient, no write occurs and balance remains unchanged.

6. **Persistence scope is runtime memory**
   - Data is stored in `DataProgram` working storage, so persistence is in-process only (not a file/database).

## Call Flow Summary

1. `MainProgram` receives menu choice.
2. `MainProgram` calls `Operations` with operation code.
3. `Operations` calls `DataProgram` to `READ` and/or `WRITE` balance.
4. `Operations` returns to `MainProgram`.
5. Loop continues until user exits.

## Sequence Diagram (Data Flow)

```mermaid
sequenceDiagram
  actor Student as User/Student
  participant Main as MainProgram (main.cob)
  participant Ops as Operations (operations.cob)
  participant Data as DataProgram (data.cob)

  loop Until user chooses Exit
    Student->>Main: Enter menu choice (1-4)

    alt Choice 1: View Balance
      Main->>Ops: CALL Operations USING 'TOTAL '
      Ops->>Data: CALL DataProgram USING 'READ', FINAL-BALANCE
      Data-->>Ops: Return STORAGE-BALANCE
      Ops-->>Main: Display current balance

    else Choice 2: Credit Account
      Main->>Ops: CALL Operations USING 'CREDIT'
      Ops-->>Student: Prompt for credit amount
      Student->>Ops: Enter AMOUNT
      Ops->>Data: CALL DataProgram USING 'READ', FINAL-BALANCE
      Data-->>Ops: Return STORAGE-BALANCE
      Ops->>Ops: ADD AMOUNT TO FINAL-BALANCE
      Ops->>Data: CALL DataProgram USING 'WRITE', FINAL-BALANCE
      Data-->>Ops: Persist updated balance
      Ops-->>Main: Display new balance

    else Choice 3: Debit Account
      Main->>Ops: CALL Operations USING 'DEBIT '
      Ops-->>Student: Prompt for debit amount
      Student->>Ops: Enter AMOUNT
      Ops->>Data: CALL DataProgram USING 'READ', FINAL-BALANCE
      Data-->>Ops: Return STORAGE-BALANCE
      Ops->>Ops: Check FINAL-BALANCE >= AMOUNT

      alt Sufficient funds
        Ops->>Ops: SUBTRACT AMOUNT FROM FINAL-BALANCE
        Ops->>Data: CALL DataProgram USING 'WRITE', FINAL-BALANCE
        Data-->>Ops: Persist updated balance
        Ops-->>Main: Display new balance
      else Insufficient funds
        Ops-->>Main: Display insufficient funds message
      end

    else Choice 4: Exit
      Main-->>Student: Goodbye message
    end
  end
```

## How to Render Mermaid

- **GitHub:** Open [docs/README.md](docs/README.md) in the repository on GitHub; Mermaid diagrams in fenced ` ```mermaid ` blocks render automatically.
- **VS Code:** Open [docs/README.md](docs/README.md) and use Markdown preview (`Ctrl+Shift+V` or `Cmd+Shift+V`).
- **If diagrams do not appear in VS Code:** Ensure Markdown preview is enabled and updated, or use a Mermaid-compatible Markdown extension.

## Compact Flowchart

```mermaid
flowchart TD
  A[Start MainProgram] --> B[Display menu and accept choice]
  B --> C{User choice}

  C -->|1 TOTAL| D[CALL Operations 'TOTAL']
  D --> E[DataProgram READ balance]
  E --> F[Display current balance]
  F --> B

  C -->|2 CREDIT| G[CALL Operations 'CREDIT']
  G --> H[Accept credit amount]
  H --> I[DataProgram READ balance]
  I --> J[Add amount]
  J --> K[DataProgram WRITE balance]
  K --> L[Display new balance]
  L --> B

  C -->|3 DEBIT| M[CALL Operations 'DEBIT']
  M --> N[Accept debit amount]
  N --> O[DataProgram READ balance]
  O --> P{Balance >= Amount?}
  P -->|Yes| Q[Subtract amount]
  Q --> R[DataProgram WRITE balance]
  R --> S[Display new balance]
  S --> B
  P -->|No| T[Display insufficient funds]
  T --> B

  C -->|4 Exit| U[Set continue flag to NO]
  U --> V[Display goodbye and stop]
```
