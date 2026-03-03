const { DataProgram, processOperation, mapChoiceToAction } = require('./index');

describe('COBOL parity unit tests from TESTPLAN', () => {
  test('TC-002: view balance returns default opening balance', () => {
    const data = new DataProgram();
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1000);
    expect(result.message).toBe('Current balance: 1000.00');
  });

  test('TC-003: credit with valid amount updates balance', () => {
    const data = new DataProgram();
    processOperation(data, 'CREDIT', 200);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1200);
    expect(result.message).toBe('Current balance: 1200.00');
  });

  test('TC-004: debit less than current balance updates balance', () => {
    const data = new DataProgram();
    processOperation(data, 'CREDIT', 200);
    processOperation(data, 'DEBIT ', 300);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(900);
    expect(result.message).toBe('Current balance: 900.00');
  });

  test('TC-005: debit equal to current balance is allowed', () => {
    const data = new DataProgram();
    processOperation(data, 'DEBIT ', 1000);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(0);
    expect(result.message).toBe('Current balance: 0.00');
  });

  test('TC-006: debit greater than current balance is rejected', () => {
    const data = new DataProgram();
    const debit = processOperation(data, 'DEBIT ', 1500);
    const result = processOperation(data, 'TOTAL ');

    expect(debit.message).toBe('Insufficient funds for this debit.');
    expect(result.balance).toBe(1000);
  });

  test('TC-007: multiple credits/debits in one session preserve running balance', () => {
    const data = new DataProgram();
    processOperation(data, 'CREDIT', 150);
    processOperation(data, 'DEBIT ', 50);
    processOperation(data, 'CREDIT', 25);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1125);
  });

  test('TC-008: invalid menu selection below range', () => {
    const result = mapChoiceToAction(0);

    expect(result.operation).toBeNull();
    expect(result.continueFlag).toBe('YES');
    expect(result.message).toBe('Invalid choice, please select 1-4.');
  });

  test('TC-009: invalid menu selection above range', () => {
    const result = mapChoiceToAction(9);

    expect(result.operation).toBeNull();
    expect(result.continueFlag).toBe('YES');
    expect(result.message).toBe('Invalid choice, please select 1-4.');
  });

  test('TC-010: exit option sets continue flag to NO', () => {
    const result = mapChoiceToAction(4);

    expect(result.operation).toBeNull();
    expect(result.continueFlag).toBe('NO');
  });

  test('TC-011: view balance after failed debit remains unchanged', () => {
    const data = new DataProgram();
    processOperation(data, 'DEBIT ', 1200);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1000);
  });

  test('TC-012: credit with zero amount does not change balance', () => {
    const data = new DataProgram();
    processOperation(data, 'CREDIT', 0);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1000);
  });

  test('TC-013: debit with zero amount does not change balance', () => {
    const data = new DataProgram();
    processOperation(data, 'DEBIT ', 0);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1000);
  });

  test('TC-014: balance resets to default on new app process start', () => {
    const session1 = new DataProgram();
    processOperation(session1, 'CREDIT', 100);
    expect(processOperation(session1, 'TOTAL ').balance).toBe(1100);

    const session2 = new DataProgram();
    expect(processOperation(session2, 'TOTAL ').balance).toBe(1000);
  });

  test('TC-015: two decimal place arithmetic is preserved', () => {
    const data = new DataProgram();
    processOperation(data, 'CREDIT', 10.25);
    processOperation(data, 'DEBIT ', 5.1);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1005.15);
    expect(result.message).toBe('Current balance: 1005.15');
  });

  test('TC-016: large valid amount within field format updates balance', () => {
    const data = new DataProgram();
    processOperation(data, 'CREDIT', 999999.99);
    const result = processOperation(data, 'TOTAL ');

    expect(result.balance).toBe(1000999.99);
    expect(result.message).toBe('Current balance: 1000999.99');
  });

  test('TC-001: menu mappings preserve original 1-3 actions', () => {
    expect(mapChoiceToAction(1).operation).toBe('TOTAL ');
    expect(mapChoiceToAction(2).operation).toBe('CREDIT');
    expect(mapChoiceToAction(3).operation).toBe('DEBIT ');
  });
});