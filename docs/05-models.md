# 05 — Models: Data Class গুলো বিস্তারিত

> Model class গুলো শুধু data রাখে। এরা database বা UI-এর সাথে কথা বলে না।

---

## Model কী?

**Model** হলো data-র blueprint। যেমন `User` class বলে "একটা User-এর কী কী তথ্য থাকে"।

C++ এর `struct` বা `class`-এর মতোই — কিন্তু Java-তে OOP fully enforced।

---

## 1. User.java

`users` table-এর একটা row-কে represent করে।

```java
package com.bloodfinder.model;

public class User {

    private int id;          // users.id — primary key
    private String name;     // users.name
    private String email;    // users.email — unique
    private String password; // users.password
    private String mobile;   // users.mobile
    private String location; // users.location

    // Full constructor — সব field দিয়ে object তৈরি
    public User(int id, String name, String email,
                String password, String mobile, String location) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.mobile = mobile;
        this.location = location;
    }

    // Registration-এর জন্য constructor (id নেই — database auto-generate করবে)
    public User(String name, String email, String password,
                String mobile, String location) {
        this(0, name, email, password, mobile, location);
    }

    // Getters
    public int getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getMobile() { return mobile; }
    public String getLocation() { return location; }

    // Setters (শুধু যেগুলো পরিবর্তন হওয়া দরকার)
    public void setName(String name) { this.name = name; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public void setLocation(String location) { this.location = location; }
    public void setPassword(String password) { this.password = password; }

    @Override
    public String toString() {
        return "User{id=" + id + ", name=" + name + ", email=" + email + "}";
    }
}
```

**Field-by-Field ব্যাখ্যা:**

| Field | Type | কী রাখে | Database Column |
|-------|------|---------|----------------|
| `id` | `int` | Unique identifier | `users.id` |
| `name` | `String` | User-এর পুরো নাম | `users.name` |
| `email` | `String` | Email (unique, login-এ use হয়) | `users.email` |
| `password` | `String` | Password (plain text) | `users.password` |
| `mobile` | `String` | Phone number | `users.mobile` |
| `location` | `String` | শহর বা এলাকা | `users.location` |

**দুটো Constructor কেন?**

```java
// Registration-এর সময় id জানা নেই (database দেবে)
User newUser = new User("Rahim", "rahim@test.com", "pass123", "01700000000", "Dhaka");

// Database থেকে load করার সময় id জানা আছে
User existingUser = new User(5, "Rahim", "rahim@test.com", "pass123", "01700000000", "Dhaka");
```

---

## 2. Donor.java

`donors` table + `users` table-এর join-এর data represent করে।

```java
package com.bloodfinder.model;

import com.bloodfinder.model.enums.BloodType;
import com.bloodfinder.model.enums.AvailabilityStatus;

public class Donor extends User {

    private int donorId;              // donors.id (NOT users.id!)
    private BloodType bloodType;      // Blood Type enum
    private String lastDonationDate;  // শেষ donation-এর তারিখ (ISO format: YYYY-MM-DD)
    private boolean isTempUnavailable; // সাময়িক unavailable কিনা

    // Full constructor
    public Donor(int id, String name, String email, String password,
                 String mobile, String location,
                 int donorId, BloodType bloodType,
                 String lastDonationDate, boolean isTempUnavailable) {
        super(id, name, email, password, mobile, location); // User-এর constructor
        this.donorId = donorId;
        this.bloodType = bloodType;
        this.lastDonationDate = lastDonationDate;
        this.isTempUnavailable = isTempUnavailable;
    }

    // Getters
    public int getDonorId() { return donorId; }
    public BloodType getBloodType() { return bloodType; }
    public String getLastDonationDate() { return lastDonationDate; }
    public boolean isTempUnavailable() { return isTempUnavailable; }

    // Setters
    public void setBloodType(BloodType bloodType) { this.bloodType = bloodType; }
    public void setLastDonationDate(String date) { this.lastDonationDate = date; }
    public void setTempUnavailable(boolean tempUnavailable) {
        this.isTempUnavailable = tempUnavailable;
    }

    // Polymorphism — availability check করে
    public AvailabilityStatus getAvailabilityStatus() {
        if (isTempUnavailable) {
            return AvailabilityStatus.TEMP_UNAVAILABLE;
        }
        if (lastDonationDate != null && DateUtil.isWithin3Months(lastDonationDate)) {
            return AvailabilityStatus.UNAVAILABLE;
        }
        return AvailabilityStatus.AVAILABLE;
    }

    @Override
    public String toString() {
        return "Donor{donorId=" + donorId + ", name=" + getName() +
               ", bloodType=" + bloodType + ", status=" + getAvailabilityStatus() + "}";
    }
}
```

### donorId vs id — এটা খুব সাধারণ confusion!

```
Database-এ দুটো table:

users table:
┌────┬────────┬───────────────────┐
│ id │ name   │ email             │
├────┼────────┼───────────────────┤
│  5 │ Rahim  │ rahim@test.com    │
└────┴────────┴───────────────────┘

donors table:
┌────┬─────────┬────────────┐
│ id │ user_id │ blood_type │
├────┼─────────┼────────────┤
│  2 │    5    │ A_POS      │
└────┴─────────┴────────────┘

Donor object:
- donor.getId()      → 5  (User-এর id, users.id)
- donor.getDonorId() → 2  (donors.id, donors table-এর pk)
```

**কখন কোনটা use করবে:**
- `donor.getId()` → User-এর identity (login, profile)
- `donor.getDonorId()` → Blood request-এ `donor_id` save করতে

---

## 3. BloodRequest.java

`blood_requests` table-এর একটা row represent করে।

```java
package com.bloodfinder.model;

import com.bloodfinder.model.enums.RequestStatus;

public class BloodRequest {

    private int id;           // blood_requests.id
    private User requester;   // কে request করেছে (Composition)
    private Donor donor;      // কোন donor-কে request (Composition)
    private String hospital;  // কোন hospital
    private String neededDate; // কখন blood দরকার
    private String reason;    // কেন দরকার
    private RequestStatus status; // PENDING / ACCEPTED / CANCELLED
    private String createdAt; // কখন request তৈরি হয়েছে

    // Full constructor
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

    // New request constructor (id ও createdAt database দেবে)
    public BloodRequest(User requester, Donor donor, String hospital,
                        String neededDate, String reason) {
        this(0, requester, donor, hospital, neededDate, reason,
             RequestStatus.PENDING, DateUtil.now());
    }

    // Getters
    public int getId() { return id; }
    public User getRequester() { return requester; }
    public Donor getDonor() { return donor; }
    public String getHospital() { return hospital; }
    public String getNeededDate() { return neededDate; }
    public String getReason() { return reason; }
    public RequestStatus getStatus() { return status; }
    public String getCreatedAt() { return createdAt; }

    // Setters
    public void setStatus(RequestStatus status) { this.status = status; }
}
```

**ব্যাখ্যা:**

- `User requester` → Composition। BloodRequest-এর ভেতরে পুরো User object আছে
- `Donor donor` → Composition। পুরো Donor object আছে
- `RequestStatus status` → Enum। শুধু PENDING, ACCEPTED, বা CANCELLED হতে পারে
- নতুন request তৈরি হলে status automatically `PENDING` হয়

---

## 4. DonationRecord.java

`donation_records` table-এর একটা row। Donor কখন কাকে donate করেছে তার record।

```java
package com.bloodfinder.model;

public class DonationRecord {

    private int id;             // donation_records.id
    private int donorId;        // donors.id (কে donate করেছে)
    private String requesterName; // কাকে donate করেছে (নামটা directly রাখা)
    private String hospital;    // কোন hospital-এ
    private String donationDate; // কবে

    // Full constructor
    public DonationRecord(int id, int donorId, String requesterName,
                          String hospital, String donationDate) {
        this.id = id;
        this.donorId = donorId;
        this.requesterName = requesterName;
        this.hospital = hospital;
        this.donationDate = donationDate;
    }

    // New record constructor
    public DonationRecord(int donorId, String requesterName,
                          String hospital, String donationDate) {
        this(0, donorId, requesterName, hospital, donationDate);
    }

    // Getters
    public int getId() { return id; }
    public int getDonorId() { return donorId; }
    public String getRequesterName() { return requesterName; }
    public String getHospital() { return hospital; }
    public String getDonationDate() { return donationDate; }
}
```

**লক্ষ্য করো:** DonationRecord-এ `User requester` object নেই, শুধু `requesterName` (String) আছে।

কেন? কারণ এটা historical record। User পরে delete হলেও donation record টা থাকবে — নাম দিয়ে।

---

## 5. Enum গুলো বিস্তারিত

### BloodType.java

```java
package com.bloodfinder.model.enums;

public enum BloodType {

    A_POS("A+"),
    A_NEG("A-"),
    B_POS("B+"),
    B_NEG("B-"),
    AB_POS("AB+"),
    AB_NEG("AB-"),
    O_POS("O+"),
    O_NEG("O-");

    private final String displayName;

    BloodType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    // Enum-এ static method — সব blood type-এর display name-এর list
    public static String[] getAllDisplayNames() {
        BloodType[] values = BloodType.values();
        String[] names = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            names[i] = values[i].getDisplayName();
        }
        return names;
    }
}
```

**Use Case:**
```java
// ComboBox-এ দেখাও "A+", "B-" ইত্যাদি
for (BloodType bt : BloodType.values()) {
    comboBox.getItems().add(bt.getDisplayName());
}

// Database-এ save করো "A_POS"
String toSave = donor.getBloodType().name();  // "A_POS"

// Database থেকে load করো
BloodType fromDb = BloodType.valueOf("A_POS");  // BloodType.A_POS
```

### RequestStatus.java

```java
package com.bloodfinder.model.enums;

public enum RequestStatus {
    PENDING,    // অপেক্ষায় আছে
    ACCEPTED,   // Donor accept করেছে
    CANCELLED;  // Cancel হয়েছে

    // Display করার জন্য Bengali-friendly string
    public String getDisplayName() {
        switch (this) {
            case PENDING:   return "Pending";
            case ACCEPTED:  return "Accepted";
            case CANCELLED: return "Cancelled";
            default:        return this.name();
        }
    }
}
```

### AvailabilityStatus.java

```java
package com.bloodfinder.model.enums;

public enum AvailabilityStatus {
    AVAILABLE,          // Donate করতে পারবে
    UNAVAILABLE,        // শেষ donation-এর ৩ মাস হয়নি
    TEMP_UNAVAILABLE;   // নিজে manually unavailable করেছে

    public String getDisplayName() {
        switch (this) {
            case AVAILABLE:        return "Available";
            case UNAVAILABLE:      return "Unavailable (3 months not passed)";
            case TEMP_UNAVAILABLE: return "Temporarily Unavailable";
            default:               return this.name();
        }
    }
}
```

---

## Util Classes সংক্ষেপে

### DateUtil.java

```java
public class DateUtil {

    // আজকের date ISO format-এ (YYYY-MM-DD)
    public static String today() {
        return LocalDate.now().toString();  // "2024-03-15"
    }

    // এখনকার datetime (database-এ createdAt এর জন্য)
    public static String now() {
        return LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
        );
    }

    // শেষ donation-এর পরে ৩ মাস হয়েছে কিনা check
    public static boolean isWithin3Months(String donationDateStr) {
        LocalDate donationDate = LocalDate.parse(donationDateStr);
        LocalDate threeMonthsAgo = LocalDate.now().minusMonths(3);
        return donationDate.isAfter(threeMonthsAgo);
        // true = ৩ মাস হয়নি (unavailable)
        // false = ৩ মাস হয়ে গেছে (available)
    }
}
```

### ValidationUtil.java

```java
public class ValidationUtil {

    // Email format ঠিক আছে কিনা
    public static boolean isValidEmail(String email) {
        return email != null && email.contains("@") && email.contains(".");
    }

    // Password কমপক্ষে ৬ character কিনা
    public static boolean isValidPassword(String password) {
        return password != null && password.length() >= 6;
    }

    // Phone number ঠিক আছে কিনা (১১ digit, 01 দিয়ে শুরু)
    public static boolean isValidMobile(String mobile) {
        return mobile != null && mobile.matches("01[0-9]{9}");
    }

    // String empty বা null কিনা
    public static boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
}
```

### AlertUtil.java

```java
public class AlertUtil {

    // Success message দেখানো
    public static void showSuccess(String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Success");
        alert.setContentText(message);
        alert.showAndWait();
    }

    // Error message দেখানো
    public static void showError(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Error");
        alert.setContentText(message);
        alert.showAndWait();
    }
}
```

### DataHolder.java

```java
// Static class — object তৈরি না করেই use করা যায়
// এটা দিয়ে দুটো screen-এর মাঝে data pass করা হয়
public class DataHolder {

    // যে Donor-এর profile দেখা হচ্ছে
    private static Donor selectedDonor;

    public static Donor getSelectedDonor() { return selectedDonor; }

    public static void setSelectedDonor(Donor donor) {
        selectedDonor = donor;
    }

    // Data clear করা (screen navigate করার পরে)
    public static void clear() {
        selectedDonor = null;
    }
}
```

**DataHolder কেন দরকার?**
JavaFX-এ একটা screen থেকে আরেকটা screen-এ data সরাসরি পাঠানো যায় না। তাই `DataHolder`-এ রেখে দেওয়া হয়, নতুন screen load হলে সেখান থেকে নেয়।

উদাহরণ:
```java
// DonorSearchController — কোনো donor select করলে
DataHolder.setSelectedDonor(selectedDonor);
App.navigateTo("donor-profile.fxml");

// DonorProfileController — এসেই data নেয়
Donor donor = DataHolder.getSelectedDonor();
```
