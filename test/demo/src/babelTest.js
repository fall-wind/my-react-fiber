import babel from '@babel/core'

console.error(babel, 'babel');


// let str = `
// function Button(props) {
//     const { label } = props
//     return <button>{label}</button>
// }

// function App(props) {
//     return (
//         <div>
//             <Button key="1" label="确定" />
//             <Button key="2" label="取消" />
//         </div>
//     )
// }`

// const result =  babel.transformSync(str, {

// })

// console.error(result, 'result')