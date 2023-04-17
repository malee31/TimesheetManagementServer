const bodyErrors = {
	request_body_empty: {
		ok: false,
		error: "request_body_empty"
	},
	body_missing_fields: {
		ok: false,
		error: "body_missing_fields"
	}
}

export function noBodyErrors(req, res, next) {
	// Note: Technically the O(n) key check and this function is not needed but it is kept for developer friendliness
	if(!req.body || !Object.keys(req.body).length) {
		return res.status(400).send(bodyErrors.request_body_empty);
	}

	next();
}

// Creates a new middleware that checks for the existence of a key in the body
// Takes an optional object that can designate a custom [key].error property
export function ensureBodyKeys(keys, verifyObj) {
	const bodyMiddleware = (req, res, next) => {
		const missingKeys = keys.filter(key => !(key in req.body));
		if(missingKeys.length === 1 && verifyObj && verifyObj[missingKeys[0]]) {
			return res.status(400).send(verifyObj[missingKeys[0]].error);
		} else if(missingKeys.length) {
			return res.status(400).send({
				...bodyErrors.body_missing_fields,
				missing_fields: missingKeys
			});
		}

		next();
	};

	return [noBodyErrors, bodyMiddleware];
}

// Convenience method for single keys
export function ensureBodyKey(key, customError) {
	// TODO: Type checks
	return ensureBodyKeys([key], {
		[key]: {
			error: customError
		}
	});
}