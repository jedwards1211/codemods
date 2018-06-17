const j = require('jscodeshift')

/**
 * Searches for imports and require statements in an AST for specifiers
 * corresponding those in the requested statement.
 * @param root - the jscodeshift-wrapped AST to search
 * @param statement - the AST for an import or require declaration to search for
 * @param {Object=} options - the options
 * @param {boolean} [options.commonjs=false] - if true, considers
 * const pkg = require('pkg') and import pkg from 'pkg' equivalent.  Otherwise,
 * considers const pkg = require('pkg').default equivalent to the import
 * statement.
 * @returns {Object} a map of all the found imports, where the key is the alias
 * in statement, and the value is the alias in the searched AST
 */
module.exports = function findImports(root, statement, options = {}) {
  const commonjs = options.commonjs || false

  let source, importKind
  if (statement.type === 'ImportDeclaration') {
    importKind = statement.importKind
    source = statement.source.value
  } else if (statement.type === 'VariableDeclaration') {
    if (statement.declarations.length !== 1) {
      throw new Error('statement must have exactly 1 VariableDeclarator')
    }
    const declarator = statement.declarations[0]
    const {init} = declarator
    if (init.type !== 'CallExpression' ||
        init.callee.name !== 'require') {
      throw new Error('statement must be an import or require')
    }
    importKind = 'value'
    source = init.arguments[0].value
  } else {
    throw new Error('invalid statement type: ' + statement.type)
  }
  const imports = root.find(j.ImportDeclaration, {importKind, source: {value: source}})
  const requires = []
  const defaultRequires = []
  root.find(j.Program).nodes()[0].body.forEach(node => {
    if (node.type !== 'VariableDeclaration') return
    for (let declarator of node.declarations) {
      const {id, init} = declarator
      if (
        init.type === 'CallExpression' &&
        init.callee.name === 'require' &&
        init.arguments[0].value === source
      ) {
        requires.push(declarator)
        if (commonjs && id.type === 'Identifier') {
          defaultRequires.push(declarator)
        }
      } else if (
        !commonjs &&
        init.type === 'MemberExpression' &&
        init.property.name === 'default' &&
        init.object.type === 'CallExpression' &&
        init.object.callee.name === 'require' &&
        init.object.arguments[0].value === source
      ) {
        defaultRequires.push(declarator)
      }
    }
  })

  function findImport(imported) {
    let matches
    if (imported === 'default') {
      matches = imports.find(j.ImportDefaultSpecifier)
      if (matches.size()) return matches.paths()[0].node.local.name
      matches = imports.find(j.ImportSpecifier, {imported: {name: 'default'}})
      if (matches.size()) return matches.paths()[0].node.local.name
      if (defaultRequires.length) return defaultRequires[defaultRequires.length - 1].id.name
    } else {
      matches = imports.find(j.ImportSpecifier, {imported: {name: imported}})
      if (matches.size()) return matches.paths()[0].node.local.name
    }
    for (let node of requires) {
      if (node.id.type !== 'ObjectPattern') continue
      for (let prop of node.id.properties) {
        if (prop.key.name === imported) return prop.value.name
      }
    }
  }

  const result = {}
  if (statement.type === 'ImportDeclaration') {
    statement.specifiers.forEach(desiredSpecifier => {
      if (desiredSpecifier.type === 'ImportNamespaceSpecifier') {
        const found = imports.find(j.ImportNamespaceSpecifier)
        if (found.size()) result[desiredSpecifier.local.name] = found.nodes()[0].local.name
      } else {
        const found = findImport(desiredSpecifier.type === 'ImportDefaultSpecifier'
          ? 'default'
          : desiredSpecifier.imported.name
        )
        if (found) result[desiredSpecifier.local.name] = found
      }
    })
  } else if (statement.type === 'VariableDeclaration') {
    const {id} = statement.declarations[0]
    if (id.type === 'ObjectPattern') {
      for (let prop of id.properties) {
        const key = prop.key.name, value = prop.value.name
        const found = findImport(key)
        if (found) result[value] = found
      }
    }
    if (id.type === 'Identifier') {
      for (let node of requires) {
        if (node.id.type === 'Identifier') {
          result[id.name] = node.id.name
          break
        }
      }
    }
  }
  return result
}
