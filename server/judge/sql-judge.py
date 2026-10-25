# Judge for SQL problems. The runner starts it as:  python sql-judge.py main.sql   (the student's query is main.sql)
# stdin is the test case: a SQL script that creates and fills the tables. The query runs on an in-memory SQLite
# database that is read-only once the script has run. Each result row is printed on one line, values joined by "|"
# (NULL as NULL, decimals with two places), so the expected output of a test case is whatever the reference query printed.
import re
import sqlite3
import sys

setup = sys.stdin.read()
query = open(sys.argv[1], encoding="utf-8").read().strip()
# Allow comments before the query, but only one statement and only a SELECT.
body = re.sub(r"--[^\n]*|/\*.*?\*/", " ", query, flags=re.S).strip().rstrip(";").strip()
if not re.match(r"(?is)^(select|with)\b", body):
    sys.exit("Write a single SELECT query.")
if ";" in body:
    sys.exit("Write one query only: remove the extra semicolon or statement.")

db = sqlite3.connect(":memory:")
db.executescript(setup)
db.execute("PRAGMA query_only = ON")
try:
    rows = db.execute(body).fetchall()
except sqlite3.Error as error:
    sys.exit(f"SQL error: {error}")


def show(value):
    if value is None:
        return "NULL"
    if isinstance(value, float):
        return f"{value:.2f}"
    return str(value)


for row in rows:
    print("|".join(show(value) for value in row))
