const j = require('jscodeshift')
const findImports = require('./findImports')

module.exports = function addImports(root, statement, options = {}) {
  const found = findImports(root, statement, options)
  const program = root.find(j.Program).at(0).nodes()[0]

  if (statement.type === 'ImportDeclaration') {
    const {importKind} = statement
    const source = {value: statement.source.value}
    let existing = root.find(j.ImportDeclaration, {importKind, source})
    for (let specifier of statement.specifiers) {
      if (found[specifier.local.name]) continue
      found[specifier.local.name] = specifier.local.name
      if (existing.size()) {
        const last = existing.paths()[existing.size() - 1].node
        last.specifiers.push(specifier)
      } else {
        const newDeclaration = j.importDeclaration(
          [specifier],
          j.stringLiteral(statement.source.value),
          importKind
        )
        const allImports = root.find(j.ImportDeclaration)
        if (allImports.size()) {
          allImports.paths()[allImports.size() - 1].insertAfter(newDeclaration)
        } else {
          program.body.unshift(newDeclaration)
        }
        existing = root.find(j.ImportDeclaration, {importKind, source})
      }
    }
  } else if (statement.type === 'VariableDeclaration') {
    // findImports only allows a single daclarator
    const declarator = statement.declarations[0]

    let existing
    if (declarator.init.type === 'MemberExpression' &&
        declarator.init.object.type === 'CallExpression') {
      existing = root.find(j.VariableDeclarator, {
        id: {
          type: declarator.id.type,
        },
        init: {
          type: 'MemberExpression',
          object: {
            type: 'CallExpression',
            arguments: [{value: declarator.init.object.arguments[0].value}]
          },
        },
      })
    } else if (declarator.init.type === 'CallExpression') {
      existing = root.find(j.VariableDeclarator, {
        id: {
          type: declarator.id.type,
        },
        init: {
          type: 'CallExpression',
          arguments: [{value: declarator.init.arguments[0].value}]
        },
      })
    }
    if (declarator.id.type === 'ObjectPattern') {
      for (let prop of declarator.id.properties) {
        if (found[prop.value.name]) continue
        found[prop.value.name] = prop.value.name
        if (existing.size()) {
          const last = existing.paths()[existing.size() - 1].node
          last.id.properties.push(prop)
        } else {
          const newDeclaration = j.variableDeclaration('const', [
            j.variableDeclarator(
              j.objectPattern([prop]),
              declarator.init,
            )
          ])
          const allImports = root.find(j.ImportDeclaration)
          if (allImports.size()) {
            allImports.paths()[allImports.size() - 1].insertAfter(newDeclaration)
          } else {
            program.body.unshift(newDeclaration)
          }
        }
      }
    } else if (declarator.id.type === 'Identifier') {
      if (!found[declarator.id.name]) {
        found[declarator.id.name] = declarator.id.name
        const newDeclaration = j.variableDeclaration('const', [
          j.variableDeclarator(
            declarator.id,
            declarator.init,
          )
        ])
        const allImports = root.find(j.ImportDeclaration)
        if (allImports.size()) {
          allImports.paths()[allImports.size() - 1].insertAfter(newDeclaration)
        } else {
          program.body.unshift(newDeclaration)
        }
      }
    }
  }

  return found
}
