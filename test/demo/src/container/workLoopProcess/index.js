import React, { useRef, useCallback, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { performCode, getNameFromFiber, draw, statusColorMap } from './util';

import 'babel-polyfill';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

require('codemirror/mode/javascript/javascript');
// require('codemirror/mode/xml/xml');

import './index.less';

function Editor(props) {
	const { changeEditStr, initStr } = props;
	const editChange = useCallback(
		(editor, data, value) => {
			changeEditStr(value);
		},
		[changeEditStr],
	);
	return (
		<div className="editor-container">
			<CodeMirror
				value={initStr}
				className="editor-item"
				autoCursor={false}
				options={{
					// mode: 'xml',
					mode: 'javascript',
					// theme: 'material',
					lineNumbers: true,
				}}
				onChange={editChange}
				ref={props.editorRef}
			/>
		</div>
	);
}

function WorkLoopShow(props) {
	const { fiberList = [], errorMsg } = props;
	useEffect(() => {
		if (fiberList.length === 0) {
			return;
		}
		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');
		console.error(canvas, ctx, '.....');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		draw(fiberList, ctx);
	}, [fiberList]);
	return (
		<div className="work-loop-show">
			{errorMsg && <span>{errorMsg}</span>}
			<div className="color-bar">
				{Object.keys(statusColorMap).map(item => {
					return (
						<div className="color-bar-item">
							<div
								style={{ background: statusColorMap[item] }}
								className="color-item"
							/>
							<div className="phase-en">{item}</div>
						</div>
					);
				})}
			</div>
			<canvas width="500" height="500" id="canvas" />
			{/* {fiberList.map(it => { */}
			{[].map(it => {
				const { fiber, phase, zIndex } = it;
				const showName = getNameFromFiber(fiber);
				return (
					<div style={{ marginLeft: zIndex * 20 }}>
						{/* {`currentComp: ${showName}; currentPhase:${phase}`} */}
						{`${phase}: ${showName}`}
					</div>
				);
			})}
		</div>
	);
}

const initStr = `
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

ReactDOM.render(<App />, document.getElementById('App'))`;

function WorkLoopProcess() {
	const editorRef = useRef(null);
	const [editStr, changeEditStr] = useState(initStr);
	const [fiberList, changeFiberList] = useState([]);
	const [errorMsg, changeErrorMsg] = useState('');

	const handleExecution = useCallback(() => {
		// ref 取不到值。。。
		if (editStr) {
			performCode(editStr)
				.then(result => {
					if (Array.isArray(result)) {
						changeErrorMsg('');
						changeFiberList(result);
					}
				})
				.catch(error => {
					changeErrorMsg(error);
					changeFiberList([]);
				});
		}
	}, [editStr]);
	return (
		<div className="work-loop-container">
			<Editor
				changeEditStr={changeEditStr}
				initStr={editStr}
				editorRef={editorRef}
			/>
			<WorkLoopShow fiberList={fiberList} errorMsg={errorMsg} />
			<button onClick={handleExecution} className="execution-btn">
				执行
			</button>
		</div>
	);
}

ReactDOM.render(<WorkLoopProcess />, document.getElementById('app'));
