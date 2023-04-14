const schemas = {
	users: `
        CREATE TABLE IF NOT EXISTS users_v2
        (
            id         INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            first_name TEXT         NOT NULL,
            last_name  TEXT         NOT NULL,
            password  VARCHAR(300)  NOT NULL UNIQUE,
            session   INT,
            FOREIGN KEY (session) REFERENCES sessions_v2(session_id)
        );
	`,
	sessions: `
        CREATE TABLE IF NOT EXISTS sessions_v2
        (
            session_id INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            password   VARCHAR(300) NOT NULL,
            startTime  BIGINT       NOT NULL,
            endTime    BIGINT       NOT NULL
        );
	`,
	apiKeys: `
        CREATE TABLE IF NOT EXISTS api_keys_v2
        (
            id       INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            password VARCHAR(300) NOT NULL,
            api_key  VARCHAR(300) NOT NULL UNIQUE,
            revoked  BOOL         NOT NULL DEFAULT FALSE
        );
	`
};

export default schemas;