import { describe, expect, it } from 'vitest'
import { checkSyntax, evaluate } from '../src/expression.ts'

describe('evaluate', () => {
  it('applies arithmetic precedence', () => {
    expect(evaluate('1 + 2 * 3', {})).toBe(7)
    expect(evaluate('(1 + 2) * 3', {})).toBe(9)
    expect(evaluate('10 - 4 - 3', {})).toBe(3)
    expect(evaluate('8 / 2 / 2', {})).toBe(2)
    expect(evaluate('1.25 + 0.75', {})).toBe(2)
  })

  it('evaluates every comparison operator', () => {
    expect(evaluate('1 < 2', {})).toBe(true)
    expect(evaluate('2 <= 2', {})).toBe(true)
    expect(evaluate('3 > 2', {})).toBe(true)
    expect(evaluate('2 >= 3', {})).toBe(false)
    expect(evaluate('2 == 2', {})).toBe(true)
    expect(evaluate('2 != 2', {})).toBe(false)
  })

  it('evaluates boolean logic with short circuits', () => {
    expect(evaluate('true && false', {})).toBe(false)
    expect(evaluate('false && x', {})).toBe(false)
    expect(evaluate('true || x', {})).toBe(true)
    expect(evaluate('false || true', {})).toBe(true)
    expect(evaluate('!false', {})).toBe(true)
    expect(evaluate('not true', {})).toBe(false)
    expect(evaluate('true and true or false', {})).toBe(true)
  })

  it('evaluates literals, identifiers, and unary minus', () => {
    expect(evaluate('null', {})).toBe(null)
    expect(evaluate('"a" + \'b\'', {})).toBe('ab')
    expect(evaluate('1 + "b"', {})).toBe('1b')
    expect(evaluate('-x', { x: 5 })).toBe(-5)
    expect(evaluate('weightKg > 0', { weightKg: 3 })).toBe(true)
  })

  it('rejects unknown identifiers and non-numeric operands', () => {
    expect(() => evaluate('missing', {})).toThrow(/unknown identifier/)
    expect(() => evaluate('"a" < 1', {})).toThrow(/expected a number/)
    expect(() => evaluate('-"a"', {})).toThrow(/expected a number/)
    expect(() => evaluate('true * 2', {})).toThrow(/expected a number/)
  })
})

describe('checkSyntax', () => {
  it('accepts valid expressions', () => {
    expect(checkSyntax('a && (b || !c) + 1 * 2 - 3 / 4 >= 5')).toBe(null)
  })

  it('reports each parse failure', () => {
    expect(checkSyntax('"unclosed')).toMatch(/unterminated string/)
    expect(checkSyntax('1 @ 2')).toMatch(/unexpected character/)
    expect(checkSyntax('1.')).toMatch(/unexpected character/)
    expect(checkSyntax('(1 + 2')).toMatch(/missing closing parenthesis/)
    expect(checkSyntax('1 2')).toMatch(/trailing tokens/)
    expect(checkSyntax('1 +')).toMatch(/unexpected end/)
    expect(checkSyntax(')')).toMatch(/unexpected token/)
  })
})
