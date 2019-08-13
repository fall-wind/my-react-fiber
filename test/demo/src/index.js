import React from './component'
import { ReactDOM } from './component'

function Button(props) {
    const { label } = props
    return <button>{label}</button>
}

function App(props) {
    return (
        <div>
            <Button label="确定" />
            <Button label="确定" />
        </div>
    )
}

ReactDOM.render(<App />, document.getElementById('app'))
