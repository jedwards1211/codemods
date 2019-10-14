const j = require('jscodeshift').withParser('babylon')
const findImports = require('./findImports')
const addImports = require('./addImports')
const graphqlToFlow = require('./graphqlToFlow')
const fs = require('fs-extra')
const { execFile } = require('promisify-child-process')
const findRoot = require('find-root')
const graphql = require('graphql')
const once = require('lodash/once')

const { expression, statement } = j.template

const PRAGMA = '@graphql-to-flow'
const AUTO_GENERATED_COMMENT = ` ${PRAGMA} auto-generated`

function regex(s, rx, callback) {
  const match = rx.exec(s)
  if (match) callback(match)
}

module.exports = async function addGraphQLFlowTypes(options) {
  const { file, schema, schemaFile, server } = options
  const code = options.code || (await fs.readFile(file, 'utf8'))
  const root = j(code)
  const gql =
    findImports(root, statement`import gql from 'graphql-tag'`).gql || 'gql'
  const addMutationFunction = once(
    () =>
      addImports(
        root,
        statement`import type {MutationFunction} from 'react-apollo'`
      ).MutationFunction
  )
  const addQueryRenderProps = once(
    () =>
      addImports(
        root,
        statement`import type {QueryRenderProps} from 'react-apollo'`
      ).QueryRenderProps
  )

  const findQueryPaths = root => [
    ...root
      .find(j.TaggedTemplateExpression, { tag: { name: gql } })
      .paths()
      .filter(path => {
        for (const pragma of getPragmas(path)) {
          if (pragma.trim() === 'ignore') return false
        }
        return true
      })
      .reverse(),
  ]

  const queryPaths = findQueryPaths(root)

  let evalNeeded = false

  for (let path of queryPaths) {
    const { node } = path
    const {
      quasi: { expressions },
    } = node
    if (expressions.length) {
      evalNeeded = true
      break
    }
  }

  let evaluatedQueries

  if (evalNeeded) {
    evaluatedQueries = await evaluateQueries()
  }

  const addedStatements = new Set()

  for (let path of queryPaths) {
    const { node } = path
    const {
      quasi: { quasis },
    } = node
    const declarator = j(path)
      .closest(j.VariableDeclarator)
      .nodes()[0]
    const query =
      (evaluatedQueries && evaluatedQueries[declarator.id.name]) ||
      quasis[0].value.raw
    const queryAST = typeof query === 'string' ? graphql.parse(query) : query
    let MutationFunction = 'MutationFunction'
    const queryNames = []
    const mutationNames = []
    graphql.visit(queryAST, {
      [graphql.Kind.OPERATION_DEFINITION]({ operation, name }) {
        switch (operation) {
          case 'query':
            if (name) queryNames.push(name.value)
            break
          case 'mutation':
            MutationFunction = addMutationFunction()
            if (name) mutationNames.push(name.value)
            break
        }
      },
    })
    const extractTypes = new Set()
    const scalarAliases = new Map()
    for (const pragma of getPragmas(path)) {
      regex(pragma, /extract(-types)?:\s*(.*)/m, m =>
        m[2].split(/\s*,\s*/g).forEach(t => extractTypes.add(t))
      )
      regex(pragma, /scalar:\s*(\w+)\s*=\s*(\w+)/m, m =>
        scalarAliases.set(m[1], m[2])
      )
    }
    const { statements: types, generatedTypes } = await graphqlToFlow({
      file,
      schema,
      schemaFile,
      server,
      query,
      MutationFunction,
      extractTypes,
      scalarAliases,
    })
    for (let type of types) {
      if (!type.comments) type.comments = []
      type.comments.push(j.commentLine(AUTO_GENERATED_COMMENT))
      const {
        id: { name },
      } = type
      const existing = root.find(j.TypeAlias, { id: { name } })
      let parent = j(path).closest(j.ExportNamedDeclaration)
      if (existing.size() > 0) {
        existing.at(0).replaceWith(type)
        addedStatements.add(type)
      } else if (parent.size()) {
        const exportDecl = j.exportNamedDeclaration(type, [], null)
        exportDecl.comments = type.comments
        type.comments = []
        parent.at(0).insertAfter(exportDecl)
        addedStatements.add(exportDecl)
      } else {
        j(path)
          .closest(j.Statement)
          .at(0)
          .insertAfter(type)
        addedStatements.add(type)
      }
    }

    if (queryNames.length) {
      const { Query } = findImports(
        root,
        statement`import {Query} from 'react-apollo'`
      )
      root
        .find(j.JSXOpeningElement, { name: { name: Query } })
        .forEach(path => {
          const queryAttr = j(path)
            .find(j.JSXAttribute, {
              name: { name: 'query' },
              value: { expression: { name: declarator.id.name } },
            })
            .at(0)
          if (!queryAttr.size()) return

          const variablesAttr = j(path)
            .find(j.JSXAttribute, { name: { name: 'variables' } })
            .at(0)
          if (variablesAttr.size()) {
            const variablesValue = variablesAttr
              .find(j.JSXExpressionContainer)
              .get('expression')
            const { variables } = onlyValue(generatedTypes.query) || {}
            if (variables && variablesValue.value.type === 'ObjectExpression') {
              variablesValue.replace(
                j.typeCastExpression(
                  variablesValue.value,
                  j.typeAnnotation(
                    j.genericTypeAnnotation(
                      j.identifier(variables.id.name),
                      null
                    )
                  )
                )
              )
            }
          }

          const elementPath = path.parentPath
          const childFunction = getChildFunction(elementPath)
          if (childFunction) {
            const firstParam = childFunction.get('params', 0)
            const { data, variables } = onlyValue(generatedTypes.query) || {}
            if (!data) return
            const QueryRenderProps = addQueryRenderProps()
            if (firstParam && firstParam.node.type === 'Identifier') {
              const newIdentifier = j.identifier(firstParam.node.name)
              newIdentifier.typeAnnotation = j.typeAnnotation(
                j.genericTypeAnnotation(
                  j.identifier(QueryRenderProps),
                  j.typeParameterInstantiation(
                    [
                      j.genericTypeAnnotation(j.identifier(data.id.name), null),
                      variables
                        ? j.genericTypeAnnotation(
                            j.identifier(variables.id.name),
                            null
                          )
                        : null,
                    ].filter(Boolean)
                  )
                )
              )
              firstParam.replace(newIdentifier)
            }
          }
        })
    }

    if (mutationNames.length) {
      const { Mutation } = findImports(
        root,
        statement`import {Mutation} from 'react-apollo'`
      )
      root
        .find(j.JSXOpeningElement, { name: { name: Mutation } })
        .forEach(path => {
          const mutationAttr = j(path)
            .find(j.JSXAttribute, {
              name: { name: 'mutation' },
              value: { expression: { name: declarator.id.name } },
            })
            .at(0)
          if (!mutationAttr.size()) return

          const elementPath = path.parentPath
          const childFunction = getChildFunction(elementPath)
          if (childFunction) {
            const firstParam = childFunction.get('params', 0)
            const { mutationFunction } =
              onlyValue(generatedTypes.mutation) || {}
            if (!mutationFunction) return
            if (firstParam && firstParam.node.type === 'Identifier') {
              const newIdentifier = j.identifier(firstParam.node.name)
              newIdentifier.typeAnnotation = j.typeAnnotation(
                j.genericTypeAnnotation(
                  j.identifier(mutationFunction.id.name),
                  null
                )
              )
              firstParam.replace(newIdentifier)
            }
          }
        })
    }
  }

  async function evaluateQueries() {
    const tempFile = file.replace(/\.js$/, '_TEMP.js')
    let tempFileWritten = false
    let stdout
    try {
      const tempRoot = j(code)
      const properties = []
      const { body } = tempRoot.find(j.Program).paths()[0].node
      body.push(statement`import {print as __graphql_print__} from 'graphql'
      `)
      for (let path of findQueryPaths(tempRoot)) {
        const declarator = j(path)
          .closest(j.VariableDeclarator)
          .nodes()[0]
        properties.push(
          j.objectProperty(
            j.identifier(declarator.id.name),
            expression`__graphql_print__(${j.identifier(declarator.id.name)})`
          )
        )
      }
      body.push(statement`console.log('__BEGIN_GRAPHQL_QUERIES__')`)
      body.push(statement`
        console.log(JSON.stringify(${j.objectExpression(properties)}))
      `)
      body.push(statement`console.log('__END_GRAPHQL_QUERIES__')`)
      tempFileWritten = true
      await fs.writeFile(tempFile, tempRoot.toSource(), 'utf8')

      const babelNode = require('path').resolve(
        findRoot(file),
        'node_modules',
        '.bin',
        'babel-node'
      )
      ;({ stdout } = await execFile(babelNode, [tempFile], {
        cwd: findRoot(file),
        encoding: 'utf8',
      }))
    } finally {
      if (tempFileWritten) await fs.remove(tempFile)
    }
    const jsonPart = stdout.substring(
      stdout.indexOf('__BEGIN_GRAPHQL_QUERIES__') +
        '__BEGIN_GRAPHQL_QUERIES__'.length,
      stdout.indexOf('__END_GRAPHQL_QUERIES__')
    )
    return JSON.parse(jsonPart)
  }

  function isStale(path) {
    const { node } = path
    if (addedStatements.has(node)) return false
    if (!node.comments) return false
    return (
      node.comments.findIndex(
        comment =>
          comment.value.trim().toLowerCase() ===
          AUTO_GENERATED_COMMENT.trim().toLowerCase()
      ) >= 0
    )
  }

  root
    .find(j.TypeAlias)
    .filter(isStale)
    .remove()
  root
    .find(j.ExportNamedDeclaration)
    .filter(isStale)
    .remove()

  const { body } = root.find(j.Program).paths()[0].node
  let prev
  for (const next of body) {
    if (!addedStatements.has(prev) && addedStatements.has(next)) {
      if (!next.comments) next.comments = []
      next.comments.push(j.commentBlock(' eslint-disable no-unused-vars '))
    } else if (addedStatements.has(prev) && !addedStatements.has(next)) {
      if (!next.comments) next.comments = []
      if (
        !next.comments.find(
          comment => comment.value.trim() === 'eslint-enable no-unused-vars'
        )
      ) {
        next.comments.push(j.commentBlock(' eslint-enable no-unused-vars '))
      }
    }
    prev = next
  }

  return root
}

function onlyValue(obj) {
  const values = Object.values(obj)
  if (values.length !== 1) return undefined
  return values[0]
}

function getChildFunction(elementPath) {
  const childFunctionContainer = j(elementPath)
    .find(j.JSXExpressionContainer)
    .filter(
      path =>
        path.parentPath && path.parentPath.parentPath.node === elementPath.node
    )
    .at(0)
  if (childFunctionContainer.size()) {
    if (childFunctionContainer.get('expression', 'params').value) {
      return childFunctionContainer.get('expression')
    }
    return null
  }
  return null
}

function* getPragmas(path) {
  while (path && path.value && path.value.type !== 'Program') {
    const { comments } = path.value
    if (comments) {
      for (const comment of comments) {
        const PRAGMA_REGEX = new RegExp(`^\\s*${PRAGMA}\\s+(.+)`, 'mg')
        const match = PRAGMA_REGEX.exec(comment.value)
        if (match) yield match[1]
      }
    }
    path = path.parent
  }
}
