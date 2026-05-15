# 03 — Setup Guide: Project কীভাবে Run করবে

---

## প্রয়োজনীয় জিনিস (Prerequisites)

Project run করার আগে নিচের জিনিসগুলো install থাকতে হবে:

1. **Java 17 বা তার উপরে** (আমরা Java 21 use করেছি)
2. **Apache Maven** (build tool)
3. **IntelliJ IDEA** বা যেকোনো Java IDE (optional, কিন্তু recommended)

---

## Step 1: Java Install করা

### Windows-এ:

1. [https://adoptium.net](https://adoptium.net) — এই website-এ যাও
2. "Temurin 21 (LTS)" download করো
3. Installer চালাও, সব default রেখে Next দাও
4. Install শেষে verify করো:

```bash
java -version
```

Output এরকম আসবে:
```
openjdk version "21.0.3" 2024-04-16
OpenJDK Runtime Environment Temurin-21.0.3+9
```

### Linux (Ubuntu/Debian)-এ:

```bash
sudo apt update
sudo apt install openjdk-21-jdk
java -version
```

### macOS-এ:

```bash
brew install openjdk@21
java -version
```

---

## Step 2: Maven Install করা

### Windows-এ:

1. [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi) — এখান থেকে "Binary zip archive" download করো
2. Extract করো (যেমন: `C:\Program Files\Maven\`)
3. System Environment Variables-এ `MAVEN_HOME` set করো
4. `Path`-এ `%MAVEN_HOME%\bin` যোগ করো
5. Verify করো:

```bash
mvn -version
```

### Linux-এ:

```bash
sudo apt install maven
mvn -version
```

### macOS-এ:

```bash
brew install maven
mvn -version
```

**Verify output:**
```
Apache Maven 3.9.x
Java version: 21.0.3
```

---

## Step 3: Project Download করা

### Git থাকলে:

```bash
git clone https://github.com/your-repo/blood-finder.git
cd blood-finder
```

### Zip file থাকলে:

1. Zip extract করো
2. Terminal/Command Prompt খোলো
3. Project folder-এ যাও:

```bash
cd path/to/blood-finder
```

---

## Step 4: Project Run করা

Project folder-এ গিয়ে এই command দাও:

```bash
mvn javafx:run
```

### প্রথমবার Run করলে কী হয়?

```
1. Maven → pom.xml পড়ে
2. Maven → Internet থেকে JavaFX ও sqlite-jdbc download করে
           (এটা একবারই হয়, cache হয়ে যায়)
3. Project compile হয়
4. App.java-র main() method call হয়
5. DatabaseManager.getInstance() call হয়
6. blood_finder.db file তৈরি হয় (যদি না থাকে)
7. 4টা table তৈরি হয়: users, donors, blood_requests, donation_records
8. Login screen দেখা যায়
```

---

## Step 5: IntelliJ IDEA দিয়ে Open করা (Optional, কিন্তু সহজ)

1. IntelliJ IDEA খোলো
2. `File → Open` → blood-finder folder select করো
3. Maven project automatically detect হবে
4. নিচে Maven sync হবে (কিছুক্ষণ অপেক্ষা করো)
5. Run করতে: `App.java` খোলো → `main()` method-এর পাশে green arrow-এ click করো

অথবা Maven panel থেকে:
```
Maven → Plugins → javafx → javafx:run
```

---

## pom.xml কী? (সংক্ষেপে)

`pom.xml` হলো Maven-এর configuration file। এখানে লেখা থাকে:

```xml
<!-- Project info -->
<groupId>com.bloodfinder</groupId>
<artifactId>blood-finder</artifactId>
<version>1.0-SNAPSHOT</version>

<!-- Dependencies — কোন library use করব -->
<dependencies>

    <!-- JavaFX Controls (Button, TextField, etc.) -->
    <dependency>
        <groupId>org.openjfx</groupId>
        <artifactId>javafx-controls</artifactId>
        <version>21</version>
    </dependency>

    <!-- JavaFX FXML (FXML file load করতে) -->
    <dependency>
        <groupId>org.openjfx</groupId>
        <artifactId>javafx-fxml</artifactId>
        <version>21</version>
    </dependency>

    <!-- SQLite JDBC Driver -->
    <dependency>
        <groupId>org.xerial</groupId>
        <artifactId>sqlite-jdbc</artifactId>
        <version>3.45.1.0</version>
    </dependency>

</dependencies>
```

**ব্যাখ্যা:**
- `<dependency>` মানে "এই library টা আমার project-এ দরকার"
- Maven automatically internet থেকে download করে নেয়
- C++ এ যেমন manually `.h` file include করতে হতো, Maven সেটা automatically করে

---

## Common Error ও সমাধান

### Error 1: `JAVA_HOME not set`
```bash
# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=%PATH%;%JAVA_HOME%\bin

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

### Error 2: `Could not find or load main class`
- IntelliJ IDEA-তে: `File → Invalidate Caches → Invalidate and Restart`
- Terminal-এ: `mvn clean javafx:run`

### Error 3: `No suitable driver found for SQLite`
- `pom.xml`-এ sqlite-jdbc dependency আছে কিনা দেখো
- `mvn clean install` চালাও

### Error 4: JavaFX module error
```
Error: JavaFX runtime components are missing
```
সমাধান: সরাসরি `java` দিয়ে run না করে `mvn javafx:run` use করো।

---

## Database File কোথায় থাকে?

Project run করার পরে project-এর root folder-এ `blood_finder.db` নামে একটা file তৈরি হবে।

```
blood-finder/
├── blood_finder.db    ← এটা database file
├── pom.xml
└── src/
```

এই file delete করলে সব data মুছে যাবে এবং পরের run-এ নতুন empty database তৈরি হবে।

---

## Database দেখার Tool

Database-এর contents দেখতে চাইলে:
- **DB Browser for SQLite** — [https://sqlitebrowser.org](https://sqlitebrowser.org) — free tool
- `blood_finder.db` file open করো, সব table ও data দেখতে পাবে

এটা development-এর সময় অনেক কাজে আসে — data ঠিকমতো save হচ্ছে কিনা verify করা যায়।
