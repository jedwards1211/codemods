// @flow

import {describe, it} from 'mocha'
import {expect} from 'chai'

import createEnumFile from '../src/createEnumFile'

describe(`createEnumFile`, function () {
  it(`works when explicit values are given`, function () {
    expect(createEnumFile('Directions.js', `
UP = 'up'
DOWN = 'down'
LEFT = 'left'
RIGHT = 'right'
`)).to.equal(`
// @flow
// @flow-runtime enable

export const Directions = {
  UP: {value: 'up', displayText: "Up"},
  DOWN: {value: 'down', displayText: "Down"},
  LEFT: {value: 'left', displayText: "Left"},
  RIGHT: {value: 'right', displayText: "Right"},
}

export type Direction = $Keys<typeof Directions>
export const UP: Direction = 'up'
export const DOWN: Direction = 'down'
export const LEFT: Direction = 'left'
export const RIGHT: Direction = 'right'

export const DirectionsArray: Array<Direction> = Object.keys(Directions)
export const DirectionsSet: Set<Direction> = new Set(DirectionsArray)
`)
  })
  it(`works when values are not given`, function () {
    expect(createEnumFile('Directions.js', `
UP
DOWN
LEFT
RIGHT
`)).to.equal(`
// @flow
// @flow-runtime enable

export const Directions = {
  UP: {value: 'UP', displayText: "Up"},
  DOWN: {value: 'DOWN', displayText: "Down"},
  LEFT: {value: 'LEFT', displayText: "Left"},
  RIGHT: {value: 'RIGHT', displayText: "Right"},
}

export type Direction = $Keys<typeof Directions>
export const UP: Direction = 'UP'
export const DOWN: Direction = 'DOWN'
export const LEFT: Direction = 'LEFT'
export const RIGHT: Direction = 'RIGHT'

export const DirectionsArray: Array<Direction> = Object.keys(Directions)
export const DirectionsSet: Set<Direction> = new Set(DirectionsArray)
`)
  })
})
