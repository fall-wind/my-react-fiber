export function createCursor(defaultValue) {
    return {
        current: defaultValue
    }
}


let valueStack = []

let index = -1

let fiberStack

function pop(cursor) {
    if (index < 0) {
        return
    }
    cursor.current = valueStack[index]

    valueS
}