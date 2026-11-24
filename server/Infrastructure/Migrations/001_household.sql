CREATE TABLE people (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, colour TEXT NOT NULL,
    version INTEGER NOT NULL CHECK(version > 0)
);
CREATE TABLE recipes (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, servings INTEGER NOT NULL CHECK(servings BETWEEN 1 AND 64),
    ingredients TEXT NOT NULL CHECK(json_valid(ingredients)),
    steps TEXT NOT NULL CHECK(json_valid(steps)),
    version INTEGER NOT NULL CHECK(version > 0)
);
CREATE TABLE entries (
    id TEXT PRIMARY KEY, day TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('event','chore')),
    title TEXT NOT NULL, person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
    start_time TEXT, end_time TEXT, done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0,1)),
    version INTEGER NOT NULL CHECK(version > 0),
    CHECK(end_time IS NULL OR (start_time IS NOT NULL AND end_time > start_time)),
    CHECK(kind = 'chore' OR done = 0)
);
CREATE INDEX entries_day ON entries(day);
CREATE TABLE meals (
    id TEXT PRIMARY KEY, day TEXT NOT NULL,
    slot TEXT NOT NULL CHECK(slot IN ('Breakfast','Lunch','Dinner','Snack')),
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
    servings INTEGER NOT NULL CHECK(servings BETWEEN 1 AND 64),
    version INTEGER NOT NULL CHECK(version > 0),
    UNIQUE(day, slot)
);
CREATE TABLE shopping_checks (
    week TEXT NOT NULL, item_key TEXT NOT NULL,
    PRIMARY KEY(week, item_key)
);
CREATE TABLE extras (
    id TEXT PRIMARY KEY, week TEXT NOT NULL, label TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0,1))
);
CREATE INDEX extras_week ON extras(week);
