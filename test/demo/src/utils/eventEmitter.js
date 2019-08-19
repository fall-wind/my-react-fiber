class EventEmitter {
	constructor() {
		this.cbMap = {};
	}

	/**
	 * 注册事件
	 * 返回一个unListen 事件
	 * @param {string} type 事件类型
	 * @param {Function} cb 事件监听回调
	 * @param {string} mode 监听事件的模式 once: 只监听一次 就移除
	 */
	on(type, cb, mode) {
		let cbs = this.cbMap[type];
		if (!cbs) {
			cbs = [];
		}
		cbs.push({ cb, mode });
		this.cbMap[type] = cbs;
		return () => {
			this.remove(type, cb);
		};
	}

	once(...args) {
		this.on(...args, 'once');
	}

	// 触发事件 可以传递参数
	emit(type, ...args) {
		// console.log(
		// 	`%c event ${type} be triggered`,
		// 	'color:rgb(20,150,250);font-size:14px',
		// );
		const cbs = this.cbMap[type];
		if (Array.isArray(cbs)) {
			for (let i = 0; i < cbs.length; i++) {
				const { cb, mode } = cbs[i];
				if (typeof cb === 'function') {
					cb(...args);
					if (mode === 'once') {
						this.remove(type, cb);
					}
				}
			}
		}
	}

	// 移除监听事件 如果cb不传 则移除全部
	// 不考虑一个事件内有相同的cb
	remove(type, cb) {
		if (cb) {
			let cbs = this.cbMap[type];
			cbs = cbs.filter(eMap => eMap.cb !== cb);
			this.cbMap[type] = cbs;
		} else {
			this.cbMap[type] = null;
			delete this.cbMap[type];
		}
	}
}

export default new EventEmitter();
