import { v4 as uuidv4 } from "uuid";

/**
 * Very simple function to create a valid user api key. Used to ensure that new api keys follow the convention
 * @return {string} A valid randomized API key. Nearly guaranteed to be unique (includes uuid)
 */
export function makeNewApiKey() {
	return `U-${uuidv4()}`;
}