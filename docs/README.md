# Blood Finder — Project Documentation

> **লেখক:** Julie এবং Team
> **Course:** CSE 2nd Year — Object Oriented Programming
> **Technology:** JavaFX 21 + SQLite + Maven

---

## এই Documentation কেন?

এই documentation folder-এ Blood Finder project-এর সব কিছু বাংলায় ব্যাখ্যা করা আছে। যেকোনো teammate বা teacher-এর সামনে project explain করতে এই files পড়লেই হবে। Technical terms (যেমন: `class`, `method`, `interface`, `return`) English-এ রাখা হয়েছে কারণ এগুলো Java-র actual keywords। বাকি সব explanation বাংলায়।

---

## Documentation Index (Table of Contents)

| File | বিষয় |
|------|-------|
| [01-project-overview.md](01-project-overview.md) | Project কী, কী কী feature আছে, কে কে use করবে |
| [02-architecture.md](02-architecture.md) | MVC pattern কী, folder structure, data কীভাবে flow করে |
| [03-setup-guide.md](03-setup-guide.md) | Project কীভাবে install ও run করতে হবে step by step |
| [04-oop-concepts.md](04-oop-concepts.md) | OOP-এর সব concept — code সহ বাংলায় ব্যাখ্যা |
| [05-models.md](05-models.md) | Model class গুলো — User, Donor, BloodRequest, DonationRecord, Enum |
| [06-database.md](06-database.md) | SQLite কী, JDBC কী, DatabaseManager, সব SQL table ব্যাখ্যা |
| [07-repositories.md](07-repositories.md) | Repository pattern, সব Repository class ও তাদের method |
| [08-services.md](08-services.md) | Service layer কী, AuthService, DonorService, SearchService, RequestService |
| [09-controllers-javafx.md](09-controllers-javafx.md) | JavaFX কী, FXML কী, Controller কীভাবে কাজ করে, সব Controller |
| [10-complete-flow.md](10-complete-flow.md) | Register থেকে Blood Request পর্যন্ত — পুরো flow code সহ |

---

## Project সংক্ষেপ

**Blood Finder** একটি Desktop Application যেটা দিয়ে Blood Donor খোঁজা যায়। কেউ Blood Donor হতে পারে, আবার কেউ Blood Request পাঠাতে পারে।

### মূল Features:
- User Registration ও Login
- Donor হিসেবে নিজেকে Register করা
- Blood Type এবং Location দিয়ে Donor Search করা
- Donor-কে Blood Request পাঠানো
- Donor Request Accept বা Cancel করতে পারে
- Donation Record automatically save হয়

### Technology Stack:
```
Language    : Java 21
UI          : JavaFX 21 (FXML)
Database    : SQLite (file-based, কোনো server লাগে না)
JDBC Driver : sqlite-jdbc
Build Tool  : Maven
Pattern     : MVC (Model-View-Controller)
```

---

## কীভাবে পড়বে?

1. প্রথমে **01-project-overview.md** পড়ো — project সম্পর্কে general ধারণা পাবে
2. তারপর **02-architecture.md** — কোড কীভাবে organize করা আছে বুঝবে
3. **03-setup-guide.md** — project নিজে run করে দেখো
4. **04-oop-concepts.md** — এটা সবচেয়ে important, teacher এখান থেকে জিজ্ঞেস করবে
5. বাকি files গুলো specific topic-এর জন্য reference হিসেবে রাখো

---

## Quick Start

```bash
# Project folder-এ গিয়ে এই command দাও:
mvn javafx:run
```

প্রথমবার run করলে automatically `blood_finder.db` নামে একটা SQLite database file তৈরি হবে।

---

> **Note:** এই project-এ কোনো internet connection লাগে না। সব data local SQLite file-এ save হয়।
