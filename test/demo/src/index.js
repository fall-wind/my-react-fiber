import React from './component'
import { ReactDOM } from './component'

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

ReactDOM.render(<App />, document.getElementById('app'))
