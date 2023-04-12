const schemas = {
	users: `
        CREATE TABLE IF NOT EXISTS users_v2
        (
            id        INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            firstName TEXT         NOT NULL,
            lastName  TEXT         NOT NULL,
            password  VARCHAR(300) NOT NULL UNIQUE,
            signedIn  BOOL DEFAULT false,
            lastTime  BIGINT       NOT NULL
        )
	`,
	sessions: `
        CREATE TABLE IF NOT EXISTS sessions_v2
        (
            id        INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            password  VARCHAR(300) NOT NULL,
            startTime BIGINT       NOT NULL,
            endTime   BIGINT       NOT NULL
        )
	`,
	apiKeys: `
        CREATE TABLE IF NOT EXISTS api_keys_v2
        (
            id       INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            password VARCHAR(300) NOT NULL,
            api_key  VARCHAR(300) NOT NULL
        )
	`
};

export default schemas;