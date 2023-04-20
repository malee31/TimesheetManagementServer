import { v4 as uuidv4 } from "uuid";

export function makeNewApiKey() {
	return `U-${uuidv4()}`;
}