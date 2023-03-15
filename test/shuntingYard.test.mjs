import { strict as assert } from 'assert/strict'
import { test } from 'node:test'
import { evaluatePostfix, infixToPostfix } from '../build/src/lib/Utility/ShuntingYard.mjs'

test('infixToPostfix', () => {
  assert.deepStrictEqual(infixToPostfix('1 + 2'), '1 2 +')
  assert.deepStrictEqual(infixToPostfix('1 + 2 * 3'), '1 2 3 * +')
  assert.deepStrictEqual(infixToPostfix('1 + 2 * 3 / 4'), '1 2 3 * 4 / +')
  assert.deepStrictEqual(infixToPostfix('1 * ( 2 + 3 )'), '1 2 3 + *')
  assert.deepStrictEqual(infixToPostfix('1 * ( 2 + 3 ) / 4'), '1 2 3 + * 4 /')
})

test('evaluatePostfix', () => {
  assert.deepStrictEqual(evaluatePostfix('1 2 +'), 3)
  assert.deepStrictEqual(evaluatePostfix('1 2 3 * +'), 7)
  assert.deepStrictEqual(evaluatePostfix('1 2 3 * 4 / +'), 2.5)
  assert.deepStrictEqual(evaluatePostfix('1 2 3 + *'), 5)
  assert.deepStrictEqual(evaluatePostfix('1 2 3 + * 4 /'), 1.25)
  assert.deepStrictEqual(evaluatePostfix('2 3 4 + *'), 14)
  assert.deepStrictEqual(evaluatePostfix('2 5 4 / *'), 2.5) // 2 * ( 5 / 4 )
})

test('combining both', () => {
  assert.deepStrictEqual(
    evaluatePostfix(infixToPostfix('2 * ( 5 / ( 4 / 5 ) )')),
    12.5,
    'nested parenthesis'
  )
})
