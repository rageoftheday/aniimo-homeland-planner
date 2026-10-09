CREATE TABLE IF NOT EXISTS suggestions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 author TEXT NOT NULL DEFAULT 'Guest',
 category TEXT NOT NULL,
 title TEXT NOT NULL,
 body TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'Pending',
 locked INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS comments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 suggestion_id INTEGER NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
 author TEXT NOT NULL DEFAULT 'Guest',
 body TEXT NOT NULL,
 approved INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS suggestions_status ON suggestions(status,created_at);
CREATE INDEX IF NOT EXISTS comments_suggestion ON comments(suggestion_id,approved);
CREATE TABLE IF NOT EXISTS submission_limits (
 ip_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS submission_limits_lookup ON submission_limits(ip_hash,created_at);

-- Daily anonymized unique visitors. No raw IP address is stored.
CREATE TABLE IF NOT EXISTS visitor_daily (
 day TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 PRIMARY KEY(day, fingerprint)
);
CREATE TABLE IF NOT EXISTS visitor_hits (
 day TEXT PRIMARY KEY,
 hits INTEGER NOT NULL DEFAULT 0
);
