/**
 * TypeScript interface parser using the TS compiler API
 */

import ts from 'typescript'
import { readFileSync } from 'fs'
import type { ParsedInterface, ParsedProperty, ParseResult } from './types'

/**
 * Extracts JSDoc tags from a node
 */
function extractJSDocTags(node: ts.Node): Record<string, string> {
  const tags: Record<string, string> = {}

  const jsDocTags = ts.getJSDocTags(node)
  for (const tag of jsDocTags) {
    const tagName = tag.tagName.text
    const comment = tag.comment

    if (typeof comment === 'string') {
      tags[tagName] = comment
    } else if (Array.isArray(comment)) {
      tags[tagName] = comment.map(c => c.text).join('')
    } else {
      tags[tagName] = ''
    }
  }

  return tags
}

/**
 * Converts a TypeScript type node to a string representation
 */
function typeNodeToString(typeNode: ts.TypeNode | undefined, checker?: ts.TypeChecker): string {
  if (!typeNode) {
    return 'any'
  }

  // Handle array types
  if (ts.isArrayTypeNode(typeNode)) {
    return typeNodeToString(typeNode.elementType, checker) + '[]'
  }

  // Handle simple type references (e.g., string, number, Date)
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText()

    // Handle Record<K, V> types
    if (typeName === 'Record' && typeNode.typeArguments) {
      const args = typeNode.typeArguments.map(arg => typeNodeToString(arg, checker))
      return `Record<${args.join(', ')}>`
    }

    return typeName
  }

  // For basic types, just get the text
  return typeNode.getText()
}

/**
 * Parses an interface declaration
 */
function parseInterface(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string
): ParsedInterface {
  const name = node.name.text
  const properties: ParsedProperty[] = []

  // Extract heritage clauses (extends)
  const extendsClause = node.heritageClauses?.find(
    clause => clause.token === ts.SyntaxKind.ExtendsKeyword
  )
  const extendsTypes = extendsClause?.types.map(type => type.expression.getText()) || []

  // Extract properties
  for (const member of node.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const propName = member.name.getText()
      const optional = !!member.questionToken
      const type = typeNodeToString(member.type)
      const jsDocTags = extractJSDocTags(member)

      properties.push({
        name: propName,
        type,
        optional,
        jsDocTags,
      })
    }
  }

  // Get line number
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())

  return {
    name,
    properties,
    location: {
      file: filePath,
      line: line + 1, // Convert to 1-based
    },
    extends: extendsTypes.length > 0 ? extendsTypes : undefined,
  }
}

/**
 * Parses TypeScript source code and extracts interface definitions
 */
export function parseSource(source: string, filePath: string): ParseResult {
  // Create source file
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true
  )

  // Note: We don't check for parse diagnostics here as TypeScript will
  // catch syntax errors when the source files are actually compiled

  const interfaces: ParsedInterface[] = []

  // Walk the AST and find interface declarations
  function visit(node: ts.Node) {
    // Only process exported interfaces
    if (ts.isInterfaceDeclaration(node)) {
      const isExported = node.modifiers?.some(
        mod => mod.kind === ts.SyntaxKind.ExportKeyword
      )

      if (isExported) {
        interfaces.push(parseInterface(node, sourceFile, filePath))
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return {
    interfaces,
    filePath,
  }
}

/**
 * Parses a TypeScript file and extracts interface definitions
 */
export async function parseFile(filePath: string): Promise<ParseResult> {
  try {
    const source = readFileSync(filePath, 'utf-8')
    return parseSource(source, filePath)
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`)
    }
    throw error
  }
}
