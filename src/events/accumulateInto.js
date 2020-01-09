function accumulateInto(
	current,
	next,
) {
	if (current == null) {
		return next;
    }
    
	if (Array.isArray(current)) {
		if (Array.isArray(next)) {
			current.push.apply(current, next);
			return current;
		}
		current.push(next);
		return current;
	}

	if (Array.isArray(next)) {
		// A bit too dangerous to mutate `next`.
		return [current].concat(next);
	}

	return [current, next];
}

export default accumulateInto;
