# 01 — Project Overview: Blood Finder কী?

---

## Blood Finder কী?

**Blood Finder** একটি Desktop Application যেটা JavaFX দিয়ে তৈরি। এই application-এর মাধ্যমে একজন মানুষ যে Blood Donor খুঁজছে, সে তার প্রয়োজনীয় Blood Type-এর Donor খুঁজে পেতে পারে এবং সরাসরি Request পাঠাতে পারে।

সহজ ভাষায়: এটা একটা "Blood Donor Directory" — যেখানে Donor-রা নিজেদের register করে রাখে, আর যার Blood দরকার সে সেখান থেকে খুঁজে Request করে।

---

## কেন এই Project?

বাংলাদেশে জরুরি Blood দরকার হলে মানুষ Facebook-এ post দেয় অথবা phone করে খোঁজে। এটা অনেক সময়সাপেক্ষ। Blood Finder দিয়ে:
- Location ও Blood Type দিয়ে সরাসরি Donor খোঁজা যায়
- Donor-কে সরাসরি Request পাঠানো যায়
- সব record digital ভাবে save থাকে

---

## User Roles (কে কী করতে পারে)

এই project-এ দুই ধরনের User আছে:

### Role 1: Regular User
একজন সাধারণ User যে account তৈরি করেছে কিন্তু Donor হয়নি।

সে যা করতে পারে:
- Account তৈরি করা (Register)
- Login করা
- Donor Search করা (Blood Type + Location দিয়ে)
- Donor-এর Profile দেখা
- Donor-কে Blood Request পাঠানো
- নিজে Donor হওয়ার জন্য apply করা

### Role 2: Donor
একজন User যে নিজেকে Blood Donor হিসেবে register করেছে।

Regular User-এর সব কাজ করতে পারে, তার উপরে আরও করতে পারে:
- নিজের Donor Profile দেখা ও edit করা
- নিজের কাছে আসা Blood Request দেখা
- Request Accept করা বা Cancel করা
- নিজেকে সাময়িকভাবে Unavailable করা (Temp Unavailable)
- Donor Status সম্পূর্ণ Remove করা

---

## Features তালিকা

| Feature | কে পারে |
|---------|---------|
| Register | সবাই |
| Login / Logout | সবাই |
| Donor Search (Blood Type + Location) | সব logged-in user |
| Donor Profile দেখা | সব logged-in user |
| Blood Request পাঠানো | Regular User (Donor-কে) |
| Donor হওয়া (Become Donor) | Regular User |
| Blood Request দেখা | Donor |
| Request Accept করা | Donor |
| Request Cancel করা | Donor |
| Availability Status পরিবর্তন করা | Donor |
| Donor Status Remove করা | Donor |

---

## Technology Stack (কী কী দিয়ে তৈরি)

### Java 21
- এই project-এর main programming language Java
- C++ জানলে Java সহজ মনে হবে — syntax প্রায় একই
- পার্থক্য: Java-তে manually memory free করতে হয় না (Garbage Collector আছে)

### JavaFX 21
- JavaFX হলো Java-র একটা library যেটা দিয়ে Desktop GUI (Graphical User Interface) তৈরি করা যায়
- C++ এ যেমন Qt বা Win32 API দিয়ে GUI বানায়, Java-তে JavaFX দিয়ে বানায়
- UI design করা হয় **FXML** file-এ (XML-based) — আলাদাভাবে design ও logic রাখা যায়

### SQLite
- একটা file-based database — আলাদা server run করতে হয় না
- পুরো database একটাই `.db` file-এ থাকে (`blood_finder.db`)
- C++ এ যেমন file-এ data save করতে, SQLite-এ সেটাই structured ভাবে করা যায়

### sqlite-jdbc
- Java থেকে SQLite database-এ query করার জন্য একটা library
- JDBC মানে Java Database Connectivity — Java-র standard database connection API

### Maven
- একটা Build Tool — project compile, dependency download, run সব Maven করে
- `pom.xml` file-এ project-এর সব configuration ও dependency লেখা থাকে
- C++ এর `Makefile` এর মতো, কিন্তু অনেক বেশি powerful

---

## Project-এর Screen গুলো (Views)

```
1. Login Screen          → Email ও Password দিয়ে login
2. Register Screen       → নতুন account তৈরি
3. Dashboard Screen      → Login করার পরে main screen
4. Donor Search Screen   → Blood Type ও Location দিয়ে search
5. Donor Profile Screen  → একজন Donor-এর detail দেখা
6. Request Screen        → Blood Request form পাঠানো
7. Become Donor Screen   → নিজে Donor হওয়ার form
```

---

## OOP Concepts যা শিখবে

এই project বানাতে গিয়ে নিচের OOP concepts ব্যবহার হয়েছে:

| Concept | কোথায় ব্যবহার হয়েছে |
|---------|---------------------|
| Encapsulation | সব Model class-এ private fields + getter/setter |
| Inheritance | `Donor` class, `User` class-কে extend করেছে |
| Polymorphism | `getAvailabilityStatus()` method আলাদা result দেয় |
| Abstraction | `Repository<T>` interface |
| Enum | `BloodType`, `RequestStatus`, `AvailabilityStatus` |
| Singleton | `DatabaseManager`, `AuthService` সব Service |
| Generics | `Repository<T>` — T মানে যেকোনো type |
| Composition | `BloodRequest`-এর ভেতরে `User` ও `Donor` আছে |
| Stream API | `SearchService`-এ donor filter করতে |

এই সব concept বিস্তারিত জানতে **04-oop-concepts.md** পড়ো।

---

## Project-এর সীমাবদ্ধতা (Limitations)

- এটা একটা single-computer desktop app — network/internet নেই
- Real-time notification নেই
- Password encrypted না (শিক্ষামূলক project বলে)
- একই computer-এর সব user একই database share করে
