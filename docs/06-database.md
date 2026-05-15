# 06 — Database: SQLite, JDBC, এবং DatabaseManager

---

## SQLite কী?

**SQLite** একটা lightweight relational database। বেশিরভাগ database (MySQL, PostgreSQL)-এ আলাদা server চালাতে হয়। SQLite-এ সেটা লাগে না — পুরো database একটাই file (`.db` extension)-এ থাকে।

| MySQL/PostgreSQL | SQLite |
|-----------------|--------|
| আলাদা server process চালাতে হয় | কোনো server নেই |
| Network connection লাগে | File-based, local |
| Big production system-এ | Small/medium apps, prototype, mobile apps |
| Complex setup | শুধু `.db` file — copy করলেই হলো |

আমাদের project-এ SQLite perfect কারণ:
- এটা একটা single-computer desktop app
- কোনো network দরকার নেই
- Setup সহজ — project run করলেই database তৈরি হয়

---

## JDBC কী?

**JDBC** (Java Database Connectivity) হলো Java-র একটা standard API (Application Programming Interface) যেটা দিয়ে Java code থেকে যেকোনো database-এ query করা যায়।

JDBC → Database Driver → Database

```
Java Code
    ↓
JDBC API (java.sql.*)
    ↓
SQLite JDBC Driver (sqlite-jdbc library)
    ↓
blood_finder.db (SQLite file)
```

### Key JDBC Classes:

| Class/Interface | কাজ |
|----------------|-----|
| `DriverManager` | Database connection তৈরি করে |
| `Connection` | Database-এর সাথে active connection |
| `PreparedStatement` | SQL query prepare করে (safe, parameter সহ) |
| `ResultSet` | Query-র result rows |
| `SQLException` | Database error হলে এই exception আসে |

---

## DatabaseManager.java (Singleton)

```java
package com.bloodfinder.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager {

    // Singleton instance
    private static DatabaseManager instance;

    // Database connection object
    private Connection connection;

    // Database file-এর location ও name
    private static final String DB_URL = "jdbc:sqlite:blood_finder.db";

    // Private constructor — বাইরে থেকে new করা যাবে না
    private DatabaseManager() {
        initializeDatabase();
    }

    // getInstance — সবাই এই method দিয়ে DatabaseManager পাবে
    public static DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    // Database connect করো এবং tables তৈরি করো
    private void initializeDatabase() {
        try {
            // SQLite JDBC Driver load করো
            Class.forName("org.sqlite.JDBC");

            // Connection তৈরি করো
            // "jdbc:sqlite:blood_finder.db" মানে current directory-তে blood_finder.db file
            connection = DriverManager.getConnection(DB_URL);

            // Tables তৈরি করো (যদি না থাকে)
            createTables();

            System.out.println("Database connected successfully.");

        } catch (ClassNotFoundException e) {
            System.err.println("SQLite JDBC Driver not found: " + e.getMessage());
        } catch (SQLException e) {
            System.err.println("Database connection failed: " + e.getMessage());
        }
    }

    // সব tables তৈরি করো
    private void createTables() throws SQLException {
        Statement stmt = connection.createStatement();

        // users table
        stmt.execute(
            "CREATE TABLE IF NOT EXISTS users (" +
            "  id       INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "  name     TEXT NOT NULL, " +
            "  email    TEXT UNIQUE NOT NULL, " +
            "  password TEXT NOT NULL, " +
            "  mobile   TEXT, " +
            "  location TEXT" +
            ")"
        );

        // donors table
        stmt.execute(
            "CREATE TABLE IF NOT EXISTS donors (" +
            "  id                INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "  user_id           INTEGER UNIQUE REFERENCES users(id), " +
            "  blood_type        TEXT NOT NULL, " +
            "  last_donation_date TEXT, " +
            "  is_temp_unavailable INTEGER DEFAULT 0" +
            ")"
        );

        // blood_requests table
        stmt.execute(
            "CREATE TABLE IF NOT EXISTS blood_requests (" +
            "  id           INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "  requester_id INTEGER REFERENCES users(id), " +
            "  donor_id     INTEGER REFERENCES donors(id), " +
            "  hospital     TEXT, " +
            "  needed_date  TEXT, " +
            "  reason       TEXT, " +
            "  status       TEXT DEFAULT 'PENDING', " +
            "  created_at   TEXT" +
            ")"
        );

        // donation_records table
        stmt.execute(
            "CREATE TABLE IF NOT EXISTS donation_records (" +
            "  id             INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "  donor_id       INTEGER REFERENCES donors(id), " +
            "  requester_name TEXT, " +
            "  hospital       TEXT, " +
            "  donation_date  TEXT" +
            ")"
        );

        stmt.close();
    }

    // Connection দাও — Repository গুলো এটা use করে
    public Connection getConnection() {
        return connection;
    }

    // Application বন্ধ হওয়ার সময় connection close করো
    public void closeConnection() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

**Line-by-Line ব্যাখ্যা:**

```java
private static DatabaseManager instance;
```
Singleton-এর instance রাখার জায়গা। `static` মানে class-এর সাথে থাকে।

```java
private static final String DB_URL = "jdbc:sqlite:blood_finder.db";
```
Database URL। Format: `jdbc:sqlite:<file_path>`। এখানে `blood_finder.db` current directory-তে।

```java
Class.forName("org.sqlite.JDBC");
```
SQLite JDBC Driver load করা। Java-কে বলছি "এই driver টা use করবো"।

```java
connection = DriverManager.getConnection(DB_URL);
```
Actual connection তৈরি হচ্ছে। এই `connection` object দিয়েই সব query চালানো হবে।

```java
"CREATE TABLE IF NOT EXISTS users (...)"
```
`IF NOT EXISTS` — table আগে থেকেই থাকলে আবার তৈরি করবে না। প্রতিবার app start হলে এই code run হয়, কিন্তু tables একবারই তৈরি হয়।

---

## Database Tables বিস্তারিত

### Table 1: `users`

```sql
CREATE TABLE users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    email    TEXT    UNIQUE NOT NULL,
    password TEXT    NOT NULL,
    mobile   TEXT,
    location TEXT
);
```

**Column-by-Column ব্যাখ্যা:**

| Column | Type | Constraint | অর্থ |
|--------|------|-----------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier, automatically বাড়ে |
| `name` | TEXT | NOT NULL | খালি রাখা যাবে না |
| `email` | TEXT | UNIQUE NOT NULL | একই email দুইবার register করা যাবে না |
| `password` | TEXT | NOT NULL | খালি রাখা যাবে না |
| `mobile` | TEXT | (none) | Optional |
| `location` | TEXT | (none) | Optional |

**Sample Data:**
```
id | name    | email            | password | mobile       | location
---+---------+------------------+----------+--------------+---------
 1 | Rahim   | rahim@test.com   | pass123  | 01711111111  | Dhaka
 2 | Karim   | karim@test.com   | pass456  | 01722222222  | Chittagong
 3 | Fatema  | fatema@test.com  | pass789  | 01733333333  | Sylhet
```

---

### Table 2: `donors`

```sql
CREATE TABLE donors (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER UNIQUE REFERENCES users(id),
    blood_type          TEXT    NOT NULL,
    last_donation_date  TEXT,
    is_temp_unavailable INTEGER DEFAULT 0
);
```

**Column-by-Column ব্যাখ্যা:**

| Column | Type | Constraint | অর্থ |
|--------|------|-----------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | donors table-এর unique id |
| `user_id` | INTEGER | UNIQUE REFERENCES users(id) | কোন user Donor হয়েছে (Foreign Key) |
| `blood_type` | TEXT | NOT NULL | Blood Type enum name, e.g., "A_POS" |
| `last_donation_date` | TEXT | (none) | ISO format: "2024-01-15", null হতে পারে |
| `is_temp_unavailable` | INTEGER | DEFAULT 0 | 0 = false, 1 = true (SQLite-এ boolean নেই) |

**UNIQUE REFERENCES users(id) কী?**
- `REFERENCES users(id)` = Foreign Key। `user_id`-এর value `users.id`-এ থাকতে হবে
- `UNIQUE` = একটা user একবারই Donor হতে পারবে

**Sample Data:**
```
id | user_id | blood_type | last_donation_date | is_temp_unavailable
---+---------+------------+--------------------+--------------------
 1 |    1    | A_POS      | 2024-01-10         | 0
 2 |    3    | B_NEG      | NULL               | 0
```

Rahim (user_id=1) Donor হয়েছে A+ blood type নিয়ে।
Fatema (user_id=3) Donor হয়েছে B- blood type নিয়ে।
Karim (user_id=2) Donor হয়নি।

---

### Table 3: `blood_requests`

```sql
CREATE TABLE blood_requests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER REFERENCES users(id),
    donor_id     INTEGER REFERENCES donors(id),
    hospital     TEXT,
    needed_date  TEXT,
    reason       TEXT,
    status       TEXT DEFAULT 'PENDING',
    created_at   TEXT
);
```

**Column-by-Column ব্যাখ্যা:**

| Column | Type | Constraint | অর্থ |
|--------|------|-----------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Request-এর unique id |
| `requester_id` | INTEGER | REFERENCES users(id) | কে request করেছে (Foreign Key → users) |
| `donor_id` | INTEGER | REFERENCES donors(id) | কোন donor-কে (Foreign Key → donors) |
| `hospital` | TEXT | — | কোন hospital-এ blood দরকার |
| `needed_date` | TEXT | — | কবে দরকার |
| `reason` | TEXT | — | কেন দরকার |
| `status` | TEXT | DEFAULT 'PENDING' | 'PENDING', 'ACCEPTED', বা 'CANCELLED' |
| `created_at` | TEXT | — | কখন request তৈরি হয়েছে |

**লক্ষ্য করো:**
- `donor_id` → `donors.id` reference করে (donors table-এর id)
- `requester_id` → `users.id` reference করে (users table-এর id)

---

### Table 4: `donation_records`

```sql
CREATE TABLE donation_records (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_id       INTEGER REFERENCES donors(id),
    requester_name TEXT,
    hospital       TEXT,
    donation_date  TEXT
);
```

**Column-by-Column ব্যাখ্যা:**

| Column | Type | Constraint | অর্থ |
|--------|------|-----------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Record-এর unique id |
| `donor_id` | INTEGER | REFERENCES donors(id) | কোন donor donate করেছে |
| `requester_name` | TEXT | — | কাকে donate করেছে (নাম, object না) |
| `hospital` | TEXT | — | কোন hospital-এ |
| `donation_date` | TEXT | — | কবে donate করেছে |

---

## SQL Concepts সংক্ষেপে

### PRIMARY KEY
Table-এর প্রতিটা row-এর unique identifier। একটা row-কে uniquely identify করে।
```sql
id INTEGER PRIMARY KEY  -- id কখনো duplicate হবে না
```

### AUTOINCREMENT
Insert করার সময় id automatically বাড়তে থাকে। প্রথম row id=1, দ্বিতীয় row id=2, ইত্যাদি।
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
-- প্রথম insert → id=1
-- দ্বিতীয় insert → id=2
-- তৃতীয় insert → id=3
```

### FOREIGN KEY (REFERENCES)
অন্য table-এর row-এর reference।
```sql
donor_id INTEGER REFERENCES donors(id)
-- donor_id-এর value অবশ্যই donors.id-তে থাকতে হবে
-- এটা data integrity নিশ্চিত করে
```

### UNIQUE
কোনো column-এর value duplicate হতে পারবে না।
```sql
email TEXT UNIQUE
-- দুইজন user একই email দিয়ে register করতে পারবে না
```

### NOT NULL
Column খালি রাখা যাবে না।
```sql
name TEXT NOT NULL
-- নাম ছাড়া user তৈরি করা যাবে না
```

### DEFAULT
Value না দিলে default value use হবে।
```sql
status TEXT DEFAULT 'PENDING'
-- status না দিলে automatically 'PENDING' হবে

is_temp_unavailable INTEGER DEFAULT 0
-- value না দিলে 0 (false) হবে
```

---

## PreparedStatement কেন Use করি?

Database query করার দুটো উপায় আছে:

### বিপজ্জনক উপায় (SQL Injection attack-এর সুযোগ):
```java
// NEVER করো এটা!
String email = userInput; // ধরো user দিল: "' OR '1'='1"
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
// Query হবে: SELECT * FROM users WHERE email = '' OR '1'='1'
// এটা সব user return করবে — SQL Injection!
```

### নিরাপদ উপায় (PreparedStatement):
```java
// এটা safe
String sql = "SELECT * FROM users WHERE email = ?";
PreparedStatement pstmt = connection.prepareStatement(sql);
pstmt.setString(1, email);  // ? এর জায়গায় email বসবে, safely
ResultSet rs = pstmt.executeQuery();
```

`PreparedStatement`-এ `?` হলো placeholder। JDBC নিজে safely value বসিয়ে দেয়, SQL injection সম্ভব না।

---

## Repository গুলো কীভাবে DatabaseManager use করে

```java
// যেকোনো Repository-তে:
public class UserRepository implements Repository<User> {

    private Connection connection;

    public UserRepository() {
        // DatabaseManager Singleton থেকে connection নেওয়া
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void save(User user) throws SQLException {
        String sql = "INSERT INTO users (name, email, password, mobile, location) " +
                     "VALUES (?, ?, ?, ?, ?)";

        PreparedStatement pstmt = connection.prepareStatement(sql);
        pstmt.setString(1, user.getName());
        pstmt.setString(2, user.getEmail());
        pstmt.setString(3, user.getPassword());
        pstmt.setString(4, user.getMobile());
        pstmt.setString(5, user.getLocation());

        pstmt.executeUpdate();
        pstmt.close();
    }
}
```
