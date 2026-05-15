# Blood Finder - Windows Setup Guide

এই প্রজেক্টটি Data Structure, JavaFX এবং SQLite ডাটাবেস ব্যবহার করে তৈরি করা হয়েছে। বিল্ড টুল হিসেবে এতে **Maven** কনফিগার করা আছে। উইন্ডোজ ১০ বা ১১-তে প্রজেক্ট রান করার জন্য নিচের ধাপগুলো মনোযোগ দিয়ে অনুসরণ করুন।

## ১. প্রয়োজনীয় সফটওয়্যার (Prerequisites)

- **Java JDK 17:** (বা তার ওপরের ভার্সন)
  - ডাউনলোড লিংক: [Adoptium (Eclipse Temurin)](https://adoptium.net/) অথবা [Oracle JDK](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)।
  - উইন্ডোজে ইনস্টল করার সময় **`Add to PATH`** চেকবক্সটি সিলেক্ট করতে একদমই ভুলবেন না।

- **IDE (যেকোনো একটি):**
  - **IntelliJ IDEA Community Edition (Recommeded)** - [ডাউনলোড লিংক](https://www.jetbrains.com/idea/download/)
  - **Eclipse IDE for Java Developers** - [ডাউনলোড লিংক](https://www.eclipse.org/downloads/)

---

## ২. প্রজেক্ট সেটআপ (IDE অনুযায়ী)

### পদ্ধতি A: Eclipse IDE ব্যবহার করে
১. Eclipse ওপেন করুন।
২. ওপরের মেনু থেকে `File` ➔ `Import...` এ ক্লিক করুন।
৩. লিস্ট থেকে `Maven` ➔ `Existing Maven Projects` সিলেক্ট করে `Next >` বাটনে ক্লিক করুন।
৪. `Browse...` বাটনে ক্লিক করে আপনার `blood-finder` প্রজেক্ট ফোল্ডারটি দেখিয়ে `Finish` বাটনে ক্লিক করুন। 
*(Eclipse নিজে থেকেই প্রয়োজনীয় লাইব্রেরিগুলো ডাউনলোড করে নেবে, নিচে ডানদিকে প্রগ্রেস বারে দেখতে পাবেন Building workspace...)*
৫. **প্রজেক্ট রান করা:**
   - বামদিকের Project Explorer থেকে `blood-finder` নামের প্রজেক্টটির ওপর **Right-click** (রাইট ক্লিক) করুন।
   - `Run As` ➔ `Maven build...` (অবশ্যই তিন ডট `...` দেওয়া অপশনটি) সিলেক্ট করুন।
   - `Edit Configuration` উইন্ডো আসলে সেখানে `Goals` নামের বক্সে ঠিক এভাবে লিখুন:
     `clean compile javafx:run`
   - এরপর নিচে থাকা `Apply` বাটনে ক্লিক করে, তারপর `Run` বাটনে ক্লিক করুন!
   - পরবর্তীতে রান করার জন্য আপনাকে আর এসব করতে হবে না। শুধু প্রজেক্টের ওপর **Right-click ➔ Run As ➔ Maven build** ক্লিক করলেই হবে।

---

## ৩. Command Prompt (CMD) বা Terminal ব্যবহার করে

যদি আপনি কোনো কোড এডিটর ছাড়া শুধু কমান্ড ব্যবহার করে রান করতে চান:

১. **Maven ইনস্টল করুন:**
   - [Apache Maven Website](https://maven.apache.org/download.cgi) থেকে `Binary zip archive` (যেমন `apache-maven-3.x.x-bin.zip`) ডাউনলোড করুন।
   - সেটি আপনার কম্পিউটারের C: ড্রাইভে আনজিপ করুন।
   - পিসির **Environment Variables** ওপেন করুন। সিস্টেম ভেরিয়েবলসের `Path` এ ওই আনজিপ করা ফোল্ডারের `bin` স্ট্যাটাসের পাথ (যেমন `C:\apache-maven-3.9.x\bin`) যুক্ত করে দিন।
   - ঠিকমতো ইনস্টল হয়েছে কিনা তা বুঝতে CMD তে `mvn -version` লিখে চেক করুন।
২. **প্রজেক্ট রান করুন:**
   - উইন্ডোজের Command Prompt (CMD) ওপেন করুন।
   - `cd` কমান্ডের সাহায্যে প্রজেক্ট ফোল্ডারে প্রবেশ করুন:
     ```bash
     cd C:\path\to\blood-finder
     ```
   - এবার নিচের কমান্ডটি লিখে এন্টার চাপুন:
     ```bash
     mvn clean compile javafx:run
     ```
   একটু সময় নিয়ে সফলতার সাথে JavaFX ওপেন হয়ে আপনার অ্যাপটি চালু হয়ে যাবে।

---

## ডাটাবেস সম্পর্কিত নোট (SQLite)
প্রজেক্টটি রান করার সময় নিজে থেকেই প্রজেক্ট ফোল্ডারের ভেতরে `blood_finder.db` নামের একটি ডাটাবেস ফাইল তৈরি করে নেবে। তাই আলাদাভাবে কম্পিউটারে কোনো SQL Server ইনস্টল করার দরকার পড়বে না।
