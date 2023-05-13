import tableNames from "./table-names.js";

const schemas = {
	users: `
        CREATE TABLE IF NOT EXISTS ${tableNames.users}
        (
            id         INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            first_name TEXT         NOT NULL,
            last_name  TEXT         NOT NULL,
            password  VARCHAR(300)  NOT NULL UNIQUE,
            session   INT,
            FOREIGN KEY (session) REFERENCES ${tableNames.sessions}(session_id)
        );
	`,
	sessions: `
        CREATE TABLE IF NOT EXISTS ${tableNames.sessions}
        (
            session_id INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            password   VARCHAR(300) NOT NULL,
            startTime  BIGINT       NOT NULL,
            endTime    BIGINT
        );
	`,
	apiKeys: `
        CREATE TABLE IF NOT EXISTS ${tableNames.api_keys}
        (
            id       INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
            password VARCHAR(300) NOT NULL,
            api_key  VARCHAR(300) NOT NULL UNIQUE,
            revoked  BOOL         NOT NULL DEFAULT FALSE
        );
	`
};

export default schemas;