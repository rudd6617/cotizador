CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  tax_id TEXT,
  contact_person TEXT,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS quotations (
  number TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'won', 'lost')),
  client_name TEXT NOT NULL,
  date TEXT NOT NULL,
  currency TEXT NOT NULL,
  total REAL NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
