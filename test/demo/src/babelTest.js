import * as Babel from 'babel-standalone'
// import { React } from './component'

const { React } = require('./component')
// import React from 'react'

// why ?????

console.error(React, 'react....')

let str = `
function Button(props) {
    const { label } = props
    return <button>{label}</button>
}

function App(props) {
    return (
        <div>
            <Button key="1" label="确定" />
            <Button key="2" label="取消" />
        </div>
    )
}

render(<App />)
`

const result = Babel.transform(str, {
    presets: ['react']
})

console.error(result.code, 'code')

function render(element) {
    console.error(element, 'element...')
}

function performCode(code) {
    try {
        eval(code)
    } catch (error) {
        console.error(error, 'error')
    }
}

performCode(result.code)