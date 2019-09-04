// import WorkLoopContainer from './container/workLoopProcess/'

import React from './component';
import { ReactDOM } from './component';
const { useState } = React;

function Button(props) {
    const [count, changeState] = useState(1);
	return (
		<button
			onClick={e => {
                console.error(count, '+++++')
				changeState(count + 1);
				changeState(count + 2);
			}}
		>
			{count}
		</button>
	);
}

function App(props) {
	return (
		<div>
			<Button key="1" label="确定" />
			<Button key="2" label="取消" />
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById('app'));
