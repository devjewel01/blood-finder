# 04 — OOP Concepts: Object Oriented Programming বাংলায়

> এই file-টা সবচেয়ে important। Teacher যা জিজ্ঞেস করবে তার বেশিরভাগ এখান থেকে।

---

## 1. Encapsulation (এনক্যাপসুলেশন)

### Encapsulation কী?

**Encapsulation** মানে data লুকিয়ে রাখা এবং controlled access দেওয়া।

Class-এর ভেতরের variables (fields) কে `private` করে রাখা হয়, যাতে বাইরে থেকে সরাসরি access না করা যায়। তারপর `getter` ও `setter` method দিয়ে controlled access দেওয়া হয়।

### কেন দরকার?

ধরো `User` class-এ `password` field আছে। যদি এটা `public` হয়, যে কেউ `user.password = "hacked"` লিখে password বদলে দিতে পারবে। `private` করলে শুধু `setPassword()` method দিয়ে বদলানো যাবে, এবং ওই method-এ validation রাখা যাবে।

### আমাদের Project-এ (User.java):

```java
public class User {

    // private — বাইরে থেকে সরাসরি access নেই
    private int id;
    private String name;
    private String email;
    private String password;
    private String mobile;
    private String location;

    // Constructor — object তৈরির সময় call হয়
    public User(int id, String name, String email,
                String password, String mobile, String location) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.mobile = mobile;
        this.location = location;
    }

    // Getter — শুধু পড়তে পারবে, বদলাতে পারবে না
    public int getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getMobile() { return mobile; }
    public String getLocation() { return location; }

    // Setter — controlled ভাবে বদলাতে পারবে
    public void setName(String name) { this.name = name; }
    public void setLocation(String location) { this.location = location; }

    // Password-এর getter নেই ইচ্ছাকৃতভাবে — security
    // Password-এর setter আছে কিন্তু validation সহ
    public void setPassword(String password) {
        if (password != null && password.length() >= 6) {
            this.password = password;
        }
    }
}
```

**ব্যাখ্যা:**
- `private int id` — `id` field private, বাইরে থেকে `user.id` লিখলে error হবে
- `public int getId()` — এই method দিয়ে id পড়া যাবে
- `this.id` — `this` মানে "এই object-এর নিজের"। `id = id` লিখলে confusion হবে কোনটা parameter আর কোনটা field — তাই `this.id = id` লিখি
- Password-এর কোনো `getPassword()` নেই — এটা Encapsulation-এর security benefit

---

## 2. Inheritance (ইনহেরিটেন্স)

### Inheritance কী?

**Inheritance** মানে একটা class আরেকটা class-এর সব properties ও methods "উত্তরাধিকার" হিসেবে পায়।

C++ এর মতোই — `class Donor : public User` লেখার মতো, Java-তে লেখি `class Donor extends User`।

### আমাদের Project-এ (Donor.java):

```java
// Donor class, User class-কে extend করছে
// মানে Donor-এর সব কিছু আছে যা User-এ আছে, তার উপরে আরও কিছু আছে
public class Donor extends User {

    // Donor-এর নিজস্ব extra fields
    private int donorId;          // donors table-এর id (users table-এর id না)
    private BloodType bloodType;  // Blood Type (enum)
    private String lastDonationDate;
    private boolean isTempUnavailable;

    // Constructor — super() দিয়ে User-এর constructor call করতে হয়
    public Donor(int id, String name, String email, String password,
                 String mobile, String location,
                 int donorId, BloodType bloodType,
                 String lastDonationDate, boolean isTempUnavailable) {

        // User-এর constructor call (parent class)
        super(id, name, email, password, mobile, location);

        // Donor-এর নিজের fields set করা
        this.donorId = donorId;
        this.bloodType = bloodType;
        this.lastDonationDate = lastDonationDate;
        this.isTempUnavailable = isTempUnavailable;
    }

    // Donor-এর নিজের getter/setter
    public int getDonorId() { return donorId; }
    public BloodType getBloodType() { return bloodType; }
    public String getLastDonationDate() { return lastDonationDate; }
    public boolean isTempUnavailable() { return isTempUnavailable; }

    public void setTempUnavailable(boolean tempUnavailable) {
        isTempUnavailable = tempUnavailable;
    }
    public void setLastDonationDate(String date) {
        this.lastDonationDate = date;
    }
}
```

**ব্যাখ্যা:**
- `extends User` — Donor, User-এর সব কিছু পেয়েছে (name, email, password, mobile, location + তাদের getter/setter)
- `super(...)` — Parent class User-এর constructor call করা হচ্ছে। Java-তে child class-এর constructor-এ প্রথম কাজ হলো parent-এর constructor call করা
- Donor-এর নিজের extra fields: `donorId`, `bloodType`, `lastDonationDate`, `isTempUnavailable`

### donorId vs id — গুরুত্বপূর্ণ পার্থক্য!

```
users table:    id=5, name="Rahim", email="rahim@test.com"
donors table:   id=2, user_id=5, blood_type="A_POS"
```

- `user.getId()` বা `donor.getId()` → `5` (users table-এর id)
- `donor.getDonorId()` → `2` (donors table-এর id)

যখন blood_requests table-এ `donor_id` save করি, তখন `donor.getDonorId()` use করি কারণ সেটা `donors` table-এর `id`।

---

## 3. Polymorphism (পলিমরফিজম)

### Polymorphism কী?

**Polymorphism** মানে "অনেক রূপ"। একই method বিভিন্ন situation-এ আলাদা আলাদা result দেয়।

দুই ধরনের Polymorphism:
1. **Method Overriding** — child class, parent-এর method নিজের মতো করে লেখে
2. **Method Overloading** — একই নামের method, আলাদা parameters

### আমাদের Project-এ — `toString()` Override:

```java
// User.java
@Override
public String toString() {
    return "User{name=" + name + ", email=" + email + ", location=" + location + "}";
}

// Donor.java
@Override
public String toString() {
    // Donor নিজের মতো করে toString লিখেছে
    return "Donor{name=" + getName() + ", bloodType=" + bloodType +
           ", donorId=" + donorId + "}";
}
```

**ব্যাখ্যা:**
- `@Override` annotation মানে "আমি parent-এর method নিজের মতো করে লিখছি"
- `Object` class (সব Java class-এর ultimate parent)-এ `toString()` আছে
- User এটা override করেছে নিজের মতো
- Donor আবার User-এর `toString()` override করেছে নিজের মতো

### আমাদের Project-এ — `getAvailabilityStatus()`:

```java
// Donor.java
public AvailabilityStatus getAvailabilityStatus() {
    if (isTempUnavailable) {
        return AvailabilityStatus.TEMP_UNAVAILABLE;  // সাময়িক unavailable
    }

    if (lastDonationDate != null) {
        // শেষ donation-এর পরে ৩ মাস হয়েছে কিনা check করে
        if (DateUtil.isWithin3Months(lastDonationDate)) {
            return AvailabilityStatus.UNAVAILABLE;   // ৩ মাস হয়নি
        }
    }

    return AvailabilityStatus.AVAILABLE;             // donate করতে পারবে
}
```

**ব্যাখ্যা:**
- একই method `getAvailabilityStatus()` — কিন্তু Donor-এর state অনুযায়ী তিনটা আলাদা value return করতে পারে
- এটাই Polymorphism — একই "interface" (method signature), কিন্তু আলাদা behavior

---

## 4. Abstraction (অ্যাবস্ট্রাকশন)

### Abstraction কী?

**Abstraction** মানে "কী করবে" define করা, "কীভাবে করবে" লুকিয়ে রাখা।

Java-তে `interface` দিয়ে Abstraction করা হয়। Interface-এ শুধু method-এর নাম ও signature থাকে, implementation থাকে না।

### আমাদের Project-এ (Repository.java — Generic Interface):

```java
// Repository.java
// T মানে Type — যেকোনো class হতে পারে (User, Donor, BloodRequest...)
public interface Repository<T> {

    // save — object database-এ save করবে (কীভাবে? জানি না, জানার দরকার নেই)
    void save(T entity);

    // findById — id দিয়ে খুঁজবে, Optional<T> return করবে
    Optional<T> findById(int id);

    // findAll — সব records return করবে
    List<T> findAll();

    // update — existing record update করবে
    void update(T entity);

    // delete — record delete করবে
    void delete(int id);
}
```

**ব্যাখ্যা:**
- এটা `interface` — কোনো implementation নেই, শুধু "contract" আছে
- যে class এই interface implement করবে, তাকে এই সব method লিখতে হবে
- `<T>` মানে Generic Type — পরে explain করা হবে

### Interface Implement করা:

```java
// UserRepository.java
public class UserRepository implements Repository<User> {

    @Override
    public void save(User user) {
        // এখানে actual SQL INSERT লেখা হবে
        String sql = "INSERT INTO users (name, email, password, mobile, location) VALUES (?, ?, ?, ?, ?)";
        // ... database code
    }

    @Override
    public Optional<User> findById(int id) {
        // SELECT * FROM users WHERE id = ?
        // ... database code
    }

    // ... বাকি methods
}
```

**কেন Abstraction ভালো?**
- `UserRepository`, `DonorRepository`, `RequestRepository` — সবাই same interface follow করে
- Controller বা Service শুধু জানে "এর কাছে `save()` আছে" — কীভাবে save করে জানে না
- আজকে SQLite, কাল MySQL — শুধু Repository বদলালেই হবে, Service বা Controller ছোঁয়া লাগবে না

---

## 5. Enum (এনাম)

### Enum কী?

**Enum** মানে একটা fixed set of constants। যখন একটা variable শুধুমাত্র কয়েকটা নির্দিষ্ট value নিতে পারে, তখন Enum ব্যবহার করি।

C++ এ `enum BloodType { A_POS, A_NEG, ... };` লেখার মতো, কিন্তু Java Enum অনেক বেশি powerful।

### আমাদের Project-এ (BloodType.java):

```java
public enum BloodType {

    A_POS("A+"),
    A_NEG("A-"),
    B_POS("B+"),
    B_NEG("B-"),
    AB_POS("AB+"),
    AB_NEG("AB-"),
    O_POS("O+"),
    O_NEG("O-");

    // প্রতিটা enum value-এর সাথে একটা displayName আছে
    private final String displayName;

    // Enum constructor — private হয় সবসময়
    BloodType(String displayName) {
        this.displayName = displayName;
    }

    // Getter
    public String getDisplayName() {
        return displayName;
    }
}
```

**ব্যাখ্যা:**
- `A_POS("A+")` — enum constant-এর নাম `A_POS`, কিন্তু user-কে দেখানো হবে `"A+"` (displayName)
- Database-এ save হয়: `"A_POS"` (enum-এর name)
- Screen-এ দেখানো হয়: `"A+"` (displayName)

### অন্য Enum গুলো:

```java
// RequestStatus.java
public enum RequestStatus {
    PENDING,    // Request পাঠানো হয়েছে, কোনো action নেওয়া হয়নি
    ACCEPTED,   // Donor accept করেছে
    CANCELLED   // Cancel করা হয়েছে
}

// AvailabilityStatus.java
public enum AvailabilityStatus {
    AVAILABLE,          // Donate করতে পারবে
    UNAVAILABLE,        // শেষ donation-এর ৩ মাস হয়নি
    TEMP_UNAVAILABLE    // নিজে manually unavailable করেছে
}
```

### Enum কীভাবে Use করে:

```java
// Donor-এর blood type check করা
if (donor.getBloodType() == BloodType.A_POS) {
    System.out.println("Blood Type: " + donor.getBloodType().getDisplayName()); // "A+"
}

// String থেকে Enum বানানো (database থেকে data আনার সময়)
BloodType bt = BloodType.valueOf("A_POS");  // BloodType.A_POS

// Enum থেকে String (database-এ save করার সময়)
String btString = BloodType.A_POS.name();  // "A_POS"
```

---

## 6. Singleton Pattern (সিঙ্গেলটন)

### Singleton কী?

**Singleton** মানে একটা class-এর সারা program-এ শুধুমাত্র একটাই object তৈরি হবে।

### কেন দরকার?

Database connection একটাই থাকা উচিত। যদি প্রতিবার `new DatabaseManager()` করা হয়, তাহলে অনেক connection তৈরি হবে — এটা resource waste।

### আমাদের Project-এ (DatabaseManager.java):

```java
public class DatabaseManager {

    // static variable — class-এর সাথে থাকে, object-এর সাথে না
    private static DatabaseManager instance = null;

    private Connection connection;

    // constructor private — বাইরে থেকে new DatabaseManager() করা যাবে না!
    private DatabaseManager() {
        connect();       // database connection তৈরি করে
        createTables();  // tables তৈরি করে (যদি না থাকে)
    }

    // getInstance() — এই method দিয়েই object পাওয়া যাবে
    public static DatabaseManager getInstance() {
        if (instance == null) {
            // প্রথমবার call হলে নতুন object তৈরি হয়
            instance = new DatabaseManager();
        }
        // পরের বার call হলে আগের object-ই return হয়
        return instance;
    }

    private void connect() {
        try {
            String url = "jdbc:sqlite:blood_finder.db";
            connection = DriverManager.getConnection(url);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public Connection getConnection() {
        return connection;
    }
}
```

**ব্যাখ্যা:**
- `private static DatabaseManager instance` — একটাই instance রাখার জায়গা
- `private DatabaseManager()` — constructor private, কেউ বাইরে থেকে `new` করতে পারবে না
- `getInstance()` — প্রথমবার নতুন object তৈরি করে, পরে আগেরটাই দেয়
- সারা program-এ `DatabaseManager.getInstance()` call করলে সবাই একই object পাবে

### অন্য Singleton গুলো:

```java
// AuthService.java — same pattern
public class AuthService {
    private static AuthService instance;
    private AuthService() {}
    public static AuthService getInstance() {
        if (instance == null) instance = new AuthService();
        return instance;
    }
    // methods...
}
```

একইভাবে: `DonorService`, `SearchService`, `RequestService` সবাই Singleton।

---

## 7. Generics (জেনেরিক্স)

### Generics কী?

**Generics** মানে type-safe করে "যেকোনো type"-এর জন্য code লেখা।

`<T>` লেখা মানে "T এর জায়গায় যেকোনো class হতে পারে, কিন্তু একটা নির্দিষ্ট class।"

### আমাদের Project-এ:

```java
// Repository<T> interface — T যেকোনো type হতে পারে
public interface Repository<T> {
    void save(T entity);
    Optional<T> findById(int id);
    List<T> findAll();
}

// UserRepository — T = User
public class UserRepository implements Repository<User> {
    public void save(User user) { ... }
    public Optional<User> findById(int id) { ... }
    public List<User> findAll() { ... }
}

// DonorRepository — T = Donor
public class DonorRepository implements Repository<Donor> {
    public void save(Donor donor) { ... }
    public Optional<Donor> findById(int id) { ... }
    public List<Donor> findAll() { ... }
}
```

**ব্যাখ্যা:**
- একটাই `Repository` interface, কিন্তু User-এর জন্য `Repository<User>`, Donor-এর জন্য `Repository<Donor>`
- `List<Donor>` মানে Donor-এর list — এখানে কোনো User ঢুকবে না (compile-time check)
- C++ এর template-এর মতো: `template<typename T>`

---

## 8. Composition (কম্পোজিশন)

### Composition কী?

**Composition** মানে একটা class-এর ভেতরে অন্য class-এর object রাখা। "Has-A" relationship।

- Inheritance = "Is-A" (Donor IS-A User)
- Composition = "Has-A" (BloodRequest HAS-A User, HAS-A Donor)

### আমাদের Project-এ (BloodRequest.java):

```java
public class BloodRequest {

    private int id;

    // Composition — BloodRequest-এর ভেতরে User object আছে (requester)
    private User requester;

    // Composition — BloodRequest-এর ভেতরে Donor object আছে
    private Donor donor;

    private String hospital;
    private String neededDate;
    private String reason;
    private RequestStatus status;  // Enum use
    private String createdAt;

    public BloodRequest(int id, User requester, Donor donor,
                        String hospital, String neededDate,
                        String reason, RequestStatus status, String createdAt) {
        this.id = id;
        this.requester = requester;
        this.donor = donor;
        this.hospital = hospital;
        this.neededDate = neededDate;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
    }

    public User getRequester() { return requester; }
    public Donor getDonor() { return donor; }
    public String getHospital() { return hospital; }
    public RequestStatus getStatus() { return status; }
    // ...
}
```

**ব্যাখ্যা:**
- `BloodRequest` নিজে একটা class
- তার ভেতরে `User requester` আছে — এই User টা কে Request করেছে
- তার ভেতরে `Donor donor` আছে — কোন Donor-কে Request করা হয়েছে
- এটাই Composition — object-এর ভেতরে object

---

## 9. Stream API (স্ট্রিম এপিআই)

### Stream API কী?

**Stream API** Java 8 থেকে আসা একটা feature যেটা দিয়ে list/collection-এর উপরে operations করা যায় — filter, map, sort, collect।

C++ এর STL algorithm-এর মতো (`std::sort`, `std::find_if`), কিন্তু আরও elegant।

### আমাদের Project-এ (SearchService.java):

```java
public List<Donor> searchDonors(BloodType bloodType, String location) {

    // সব Donor-এর list আনো repository থেকে
    List<Donor> allDonors = donorRepository.findAll();

    // Stream API দিয়ে filter করা
    return allDonors.stream()

        // filter: শুধু AVAILABLE donor রাখো
        .filter(donor -> donor.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE)

        // filter: blood type match করলে রাখো (bloodType null হলে সব রাখো)
        .filter(donor -> bloodType == null || donor.getBloodType() == bloodType)

        // filter: location match করলে রাখো (empty হলে সব রাখো)
        .filter(donor -> location == null || location.isEmpty() ||
                donor.getLocation().toLowerCase().contains(location.toLowerCase()))

        // result list হিসেবে collect করো
        .collect(Collectors.toList());
}
```

**ব্যাখ্যা line by line:**

```java
allDonors.stream()
```
List-কে Stream-এ পরিণত করো। Stream মানে data-র একটা pipeline।

```java
.filter(donor -> donor.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE)
```
- `filter()` — শর্ত true হলে রাখো, false হলে বাদ দাও
- `donor -> ...` — Lambda expression। `donor` হলো current element
- C++ এ: `std::copy_if(donors.begin(), donors.end(), result, [](Donor d){ return d.isAvailable(); });`

```java
.filter(donor -> bloodType == null || donor.getBloodType() == bloodType)
```
- `bloodType == null` হলে সব donor রাখো (কোনো filter নেই)
- Otherwise শুধু matching blood type রাখো

```java
.collect(Collectors.toList())
```
- Stream শেষ করে List-এ ভরো

### আরও Stream Example:

```java
// DonorRepository থেকে সব donor এনে শুধু নাম বের করা
List<String> names = donors.stream()
    .map(donor -> donor.getName())   // প্রতিটা Donor থেকে name বের করো
    .collect(Collectors.toList());

// সর্বোচ্চ বয়সের donor খোঁজা (যদি age থাকত)
Optional<Donor> oldest = donors.stream()
    .max(Comparator.comparingInt(Donor::getAge));
```

---

## Summary Table

| Concept | সংক্ষেপ | আমাদের Project-এ |
|---------|---------|-----------------|
| Encapsulation | Private field + Getter/Setter | `User`, `Donor`, সব Model |
| Inheritance | `extends` keyword | `Donor extends User` |
| Polymorphism | Method Override/Overload | `toString()`, `getAvailabilityStatus()` |
| Abstraction | Interface | `Repository<T>` |
| Enum | Fixed constants | `BloodType`, `RequestStatus`, `AvailabilityStatus` |
| Singleton | একটাই instance | `DatabaseManager`, সব Service |
| Generics | `<T>` type parameter | `Repository<T>` |
| Composition | Object-এর ভেতরে Object | `BloodRequest` has `User` ও `Donor` |
| Stream API | Lambda + pipeline | `SearchService.searchDonors()` |
