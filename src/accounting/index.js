const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

class DataProgram {
  constructor() {
    this.storageBalance = 1000.0;
  }

  execute(operationType, balance) {
    if (operationType === 'READ') {
      return this.storageBalance;
    }

    if (operationType === 'WRITE') {
      this.storageBalance = balance;
    }

    return this.storageBalance;
  }
}

function roundToCents(amount) {
  return Math.round(amount * 100) / 100;
}

function processOperation(dataProgram, operationType, amount = 0) {
  if (operationType === 'TOTAL ') {
    const finalBalance = dataProgram.execute('READ');
    return {
      message: `Current balance: ${finalBalance.toFixed(2)}`,
      balance: finalBalance,
    };
  }

  if (operationType === 'CREDIT') {
    let finalBalance = dataProgram.execute('READ');
    finalBalance = roundToCents(finalBalance + amount);
    dataProgram.execute('WRITE', finalBalance);
    return {
      message: `Amount credited. New balance: ${finalBalance.toFixed(2)}`,
      balance: finalBalance,
    };
  }

  if (operationType === 'DEBIT ') {
    let finalBalance = dataProgram.execute('READ');

    if (finalBalance >= amount) {
      finalBalance = roundToCents(finalBalance - amount);
      dataProgram.execute('WRITE', finalBalance);
      return {
        message: `Amount debited. New balance: ${finalBalance.toFixed(2)}`,
        balance: finalBalance,
      };
    }

    return {
      message: 'Insufficient funds for this debit.',
      balance: finalBalance,
    };
  }

  return {
    message: 'Unsupported operation.',
    balance: dataProgram.execute('READ'),
  };
}

function mapChoiceToAction(userChoice) {
  if (userChoice === 1) {
    return { continueFlag: 'YES', operation: 'TOTAL ' };
  }

  if (userChoice === 2) {
    return { continueFlag: 'YES', operation: 'CREDIT' };
  }

  if (userChoice === 3) {
    return { continueFlag: 'YES', operation: 'DEBIT ' };
  }

  if (userChoice === 4) {
    return { continueFlag: 'NO', operation: null };
  }

  return {
    continueFlag: 'YES',
    operation: null,
    message: 'Invalid choice, please select 1-4.',
  };
}

class Operations {
  constructor(dataProgram, rl) {
    this.dataProgram = dataProgram;
    this.rl = rl;
  }

  async execute(passedOperation) {
    let amount = 0;
    if (passedOperation === 'CREDIT') {
      amount = await this.readAmount('Enter credit amount: ');
    } else if (passedOperation === 'DEBIT ') {
      amount = await this.readAmount('Enter debit amount: ');
    }

    const result = processOperation(this.dataProgram, passedOperation, amount);
    console.log(result.message);
  }

  async readAmount(prompt) {
    const answer = await this.rl.question(prompt);
    return Number(answer);
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const dataProgram = new DataProgram();
  const operations = new Operations(dataProgram, rl);

  let continueFlag = 'YES';

  try {
    while (continueFlag !== 'NO') {
      console.log('--------------------------------');
      console.log('Account Management System');
      console.log('1. View Balance');
      console.log('2. Credit Account');
      console.log('3. Debit Account');
      console.log('4. Exit');
      console.log('--------------------------------');

      const choice = await rl.question('Enter your choice (1-4): ');
      const userChoice = Number(choice);

      const action = mapChoiceToAction(userChoice);
      continueFlag = action.continueFlag;

      if (action.message) {
        console.log(action.message);
      }

      if (action.operation) {
        await operations.execute(action.operation);
      }
    }

    console.log('Exiting the program. Goodbye!');
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Application error:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  DataProgram,
  Operations,
  processOperation,
  mapChoiceToAction,
  roundToCents,
};