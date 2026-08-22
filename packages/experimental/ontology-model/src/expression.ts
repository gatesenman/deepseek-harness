/**
 * Sandboxed expression engine for rule bodies and metric filters. Supports
 * literals, identifiers bound to a caller-supplied scope, arithmetic,
 * comparison, and boolean logic — no property access, calls, or host escape.
 * @module
 */

/** Identifier bindings an expression evaluates against. */
export type Scope = Record<string, unknown>

type Token =
  | { type: 'num'; value: number }
  | { type: 'str'; value: string }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string }

const OPS = ['&&', '||', '==', '!=', '<=', '>=', '<', '>', '+', '-', '*', '/', '(', ')', '!']

function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    const ch = src.charAt(i)
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (ch === '"' || ch === '\'') {
      const end = src.indexOf(ch, i + 1)
      if (end === -1) throw new Error(`unterminated string: ${src.slice(i)}`)
      tokens.push({ type: 'str', value: src.slice(i + 1, end) })
      i = end + 1
      continue
    }
    if (/[0-9]/.test(ch)) {
      let j = i + 1
      while (/[0-9]/.test(src.charAt(j))) j++
      if (src.charAt(j) === '.' && /[0-9]/.test(src.charAt(j + 1))) {
        j += 2
        while (/[0-9]/.test(src.charAt(j))) j++
      }
      tokens.push({ type: 'num', value: Number(src.slice(i, j)) })
      i = j
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1
      while (/[A-Za-z0-9_]/.test(src.charAt(j))) j++
      const word = src.slice(i, j)
      if (word === 'and') tokens.push({ type: 'op', value: '&&' })
      else if (word === 'or') tokens.push({ type: 'op', value: '||' })
      else if (word === 'not') tokens.push({ type: 'op', value: '!' })
      else tokens.push({ type: 'ident', value: word })
      i = j
      continue
    }
    const op = OPS.find(o => src.startsWith(o, i))
    if (!op) throw new Error(`unexpected character: ${ch}`)
    tokens.push({ type: 'op', value: op })
    i += op.length
  }
  return tokens
}

type ComparisonOp = '==' | '!=' | '<=' | '>=' | '<' | '>'
type ArithmeticOp = '+' | '-' | '*' | '/'
type BinaryOp = '&&' | '||' | ComparisonOp | ArithmeticOp

type Node =
  | { type: 'literal'; value: unknown }
  | { type: 'ident'; name: string }
  | { type: 'unary'; op: '!' | '-'; operand: Node }
  | { type: 'binary'; op: BinaryOp; left: Node; right: Node }

/** Recursive-descent parser over the token list; precedence encoded in the call chain. */
class Parser {
  private pos = 0
  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.parseOr()
    if (this.pos < this.tokens.length) {
      throw new Error('trailing tokens after expression')
    }
    return node
  }

  private peekOp<O extends string>(...ops: O[]): O | null {
    const t = this.tokens[this.pos]
    return t !== undefined && t.type === 'op' && (ops as string[]).includes(t.value) ? t.value as O : null
  }

  private parseOr(): Node {
    let left = this.parseAnd()
    while (this.peekOp('||')) {
      this.pos++
      left = { type: 'binary', op: '||', left, right: this.parseAnd() }
    }
    return left
  }

  private parseAnd(): Node {
    let left = this.parseComparison()
    while (this.peekOp('&&')) {
      this.pos++
      left = { type: 'binary', op: '&&', left, right: this.parseComparison() }
    }
    return left
  }

  private parseComparison(): Node {
    const left = this.parseAdditive()
    const op = this.peekOp('==', '!=', '<=', '>=', '<', '>')
    if (op) {
      this.pos++
      return { type: 'binary', op, left, right: this.parseAdditive() }
    }
    return left
  }

  private parseAdditive(): Node {
    let left = this.parseMultiplicative()
    for (;;) {
      const op = this.peekOp('+', '-')
      if (!op) return left
      this.pos++
      left = { type: 'binary', op, left, right: this.parseMultiplicative() }
    }
  }

  private parseMultiplicative(): Node {
    let left = this.parseUnary()
    for (;;) {
      const op = this.peekOp('*', '/')
      if (!op) return left
      this.pos++
      left = { type: 'binary', op, left, right: this.parseUnary() }
    }
  }

  private parseUnary(): Node {
    if (this.peekOp('!')) {
      this.pos++
      return { type: 'unary', op: '!', operand: this.parseUnary() }
    }
    if (this.peekOp('-')) {
      this.pos++
      return { type: 'unary', op: '-', operand: this.parseUnary() }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): Node {
    const t = this.tokens[this.pos]
    if (!t) throw new Error('unexpected end of expression')
    if (t.type === 'num' || t.type === 'str') {
      this.pos++
      return { type: 'literal', value: t.value }
    }
    if (t.type === 'ident') {
      this.pos++
      if (t.value === 'true') return { type: 'literal', value: true }
      if (t.value === 'false') return { type: 'literal', value: false }
      if (t.value === 'null') return { type: 'literal', value: null }
      return { type: 'ident', name: t.value }
    }
    if (t.value === '(') {
      this.pos++
      const inner = this.parseOr()
      if (!this.peekOp(')')) throw new Error('missing closing parenthesis')
      this.pos++
      return inner
    }
    throw new Error(`unexpected token: ${t.value}`)
  }
}

function asNumber(v: unknown): number {
  if (typeof v === 'number') return v
  throw new Error(`expected a number, got: ${JSON.stringify(v)}`)
}

function evalNode(node: Node, scope: Scope): unknown {
  switch (node.type) {
    case 'literal':
      return node.value
    case 'ident': {
      if (!(node.name in scope)) {
        throw new Error(`unknown identifier: ${node.name}`)
      }
      return scope[node.name]
    }
    case 'unary': {
      const v = evalNode(node.operand, scope)
      return node.op === '!' ? !v : -asNumber(v)
    }
    case 'binary': {
      const l = evalNode(node.left, scope)
      if (node.op === '&&') return Boolean(l) && Boolean(evalNode(node.right, scope))
      if (node.op === '||') return Boolean(l) || Boolean(evalNode(node.right, scope))
      const r = evalNode(node.right, scope)
      switch (node.op) {
        case '==':
          return l === r
        case '!=':
          return l !== r
        case '<':
          return asNumber(l) < asNumber(r)
        case '<=':
          return asNumber(l) <= asNumber(r)
        case '>':
          return asNumber(l) > asNumber(r)
        case '>=':
          return asNumber(l) >= asNumber(r)
        case '+':
          return typeof l === 'string' || typeof r === 'string'
            ? String(l) + String(r)
            : asNumber(l) + asNumber(r)
        case '-':
          return asNumber(l) - asNumber(r)
        case '*':
          return asNumber(l) * asNumber(r)
        case '/':
          return asNumber(l) / asNumber(r)
      }
    }
  }
}

/**
 * Parse and evaluate an expression against a scope of identifier bindings.
 * @param src - expression source text.
 * @param scope - identifier bindings (e.g. instance property values).
 * @returns the evaluated value.
 * @throws Error on a parse failure, an unbound identifier, or a non-numeric
 * operand to an arithmetic or ordering operator.
 */
export function evaluate(src: string, scope: Scope): unknown {
  return evalNode(new Parser(tokenize(src)).parse(), scope)
}

/**
 * Check that an expression parses.
 * @param src - expression source text.
 * @returns null when valid, otherwise the parse error message.
 */
export function checkSyntax(src: string): string | null {
  try {
    new Parser(tokenize(src)).parse()
    return null
  } catch (e) {
    /* v8 ignore next -- tokenize/parse throw only Error instances; the String fallback is defensive. */
    return e instanceof Error ? e.message : String(e)
  }
}
