# Blood Finder — Project Idea

## আমার পরিচয়
আমি **জুলি**, Computer Science এ ২য় বর্ষের ছাত্রী।
C/C++ দিয়ে Online Judge গুলোতে problem solving করি — Data Structure ও Algorithm এর basic ধারণা আছে।
এখন আমাদের **Java OOP Programming** কোর্স চলছে — OOP তে আমি নতুন।

---

## প্রজেক্টের আইডিয়া

আমাদের Java OOP দিয়ে প্রজেক্ট করতে দেওয়া হয়েছে।
আমি **Blood Finder** নামে একটি **Blood Donor Management System** বানানোর প্ল্যান করেছি।

### মূল ধারণা
- **Blood Donor** রা Name, Mobile, Email, Location, Blood Type, Last Donation Date দিয়ে registration করবে
- Last donation থেকে **৩ মাস** পার হলে তাকে **Available** দেখাবে
- যেকেউ গিয়ে **Blood Search** করতে পারবে:
  - Blood Type দিয়ে (যেমন A+) search করলে সেই type এর donor list আসবে
  - Location দিয়ে filter করলে সেই এলাকার donor দেখাবে
  - Hospital/Medical এর নাম দিয়ে search করলে সেই এলাকার কাছের donor দেখাবে
- Logged-in user সরাসরি donor কে **Blood Request** পাঠাতে পারবে

---

## প্রজেক্টের লক্ষ্য
- OOP এর সব concept (Encapsulation, Inheritance, Polymorphism, Abstraction, Interface, Enum, Singleton, Generics, Collections) এই প্রজেক্ট থেকেই শেখা
- Clean architecture ও maintainable code
- ভবিষ্যতে বড় করার সুবিধা রাখা
- স্যারকে সহজে বুঝিয়ে present করতে পারা

---

## Technology Stack
| Component | Technology |
|-----------|-----------|
| Language | Java |
| UI | JavaFX (FXML + CSS) |
| Database | SQLite |
| Build Tool | Maven |
| Architecture | MVC (Model-View-Controller) |
