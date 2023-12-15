interface Operator {
  operator: (a: number, b: number) => number
  precedence: number
}

const operators: Record<string, Operator> = {
  '+': {
    operator: (a, b) => a + b,
    precedence: 0
  },
  '-': {
    operator: (a, b) => a - b,
    precedence: 0
  },
  '*': {
    operator: (a, b) => a * b,
    precedence: 1
  },
  '/': {
    operator: (a, b) => a / b,
    precedence: 1
  },
  '^': {
    operator: (a, b) => a ** b,
    precedence: 2
  }
}

// Evaluate a postfix expression and return the result
export const evaluatePostfix = (expression: string): number => {
  // Create an empty stack for the operands
  const operandStack: number[] = []

  // Split the expression into tokens
  const tokens = expression.split(' ')

  // Iterate over the tokens
  for (const token of tokens) {
    // If the token is a number, push it onto the stack
    if (!Object.hasOwn(operators, token)) {
      operandStack.push(Number(token))
    } else {
      const rightOperand = operandStack.pop()
      const leftOperand = operandStack.pop()
      const result = operators[token].operator(leftOperand!, rightOperand!)
      operandStack.push(result)
    }
  }

  return operandStack.pop()!
}

export const infixToPostfix = (expression: string): string => {
  const operatorStack: string[] = []
  const postfix: string[] = []

  const tokens = expression.split(' ')

  for (const token of tokens) {
    if (Object.hasOwn(operators, token)) {
      while (
        operatorStack.length > 0
        && Object.hasOwn(operators, operatorStack[operatorStack.length - 1])
        && operators[operatorStack[operatorStack.length - 1]].precedence >= operators[token].precedence
      ) {
        postfix.push(operatorStack.pop()!)
      }

      operatorStack.push(token)
    } else if (token === '(') {
      operatorStack.push(token)
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        postfix.push(operatorStack.pop()!)
      }

      if (operatorStack.length > 0) {
        operatorStack.pop()
      }
    } else {
      postfix.push(token)
    }
  }

  while (operatorStack.length > 0) {
    postfix.push(operatorStack.pop()!)
  }

  return postfix.join(' ')
}
