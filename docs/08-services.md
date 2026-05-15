# 08 — Services: Business Logic Layer

---

## Service Layer কী?

**Service** হলো business logic-এর জায়গা।

**Business logic** মানে "নিয়মকানুন" — application কীভাবে কাজ করবে তার নিয়ম।

উদাহরণ:
- Register করতে হলে email unique হতে হবে → নিয়ম
- Password কমপক্ষে ৬ character হতে হবে → নিয়ম
- Login করতে হলে email + password দুটোই match করতে হবে → নিয়ম
- একজন user একবারই Donor হতে পারবে → নিয়ম
- Blood Request accept করলে Donation Record তৈরি হবে → নিয়ম

এই নিয়মগুলো Service-এ থাকে।

```
Controller → "User login করতে চাইছে"
Service → "email check করো, password check করো, সব ঠিক থাকলে হ্যাঁ"
Repository → "database-এ email দিয়ে user খুঁজে দাও"
```

Service সব জায়গায় **Singleton** — একটাই instance, সব Controller একই Service use করে।

---

## 1. AuthService.java

Login, Register, Logout পরিচালনা করে।

```java
package com.bloodfinder.service;

import com.bloodfinder.model.User;
import com.bloodfinder.repository.UserRepository;
import com.bloodfinder.util.ValidationUtil;

import java.util.Optional;

public class AuthService {

    // Singleton
    private static AuthService instance;
    private final UserRepository userRepository;

    // বর্তমানে login করা User
    private User currentUser;

    private AuthService() {
        this.userRepository = new UserRepository();
    }

    public static AuthService getInstance() {
        if (instance == null) {
            instance = new AuthService();
        }
        return instance;
    }

    // ====== REGISTER ======
    public boolean register(String name, String email, String password,
                            String mobile, String location) {

        // Step 1: Input validation
        if (ValidationUtil.isEmpty(name) || ValidationUtil.isEmpty(email) ||
            ValidationUtil.isEmpty(password)) {
            throw new IllegalArgumentException("Name, email, and password are required.");
        }

        // Step 2: Email format check
        if (!ValidationUtil.isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email format.");
        }

        // Step 3: Password length check
        if (!ValidationUtil.isValidPassword(password)) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        // Step 4: Mobile format check (যদি দেওয়া হয়)
        if (!ValidationUtil.isEmpty(mobile) && !ValidationUtil.isValidMobile(mobile)) {
            throw new IllegalArgumentException("Invalid mobile number format.");
        }

        // Step 5: Email already exists কিনা check
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Email already registered.");
        }

        // Step 6: সব ঠিক থাকলে User তৈরি করে save করো
        User newUser = new User(name, email, password, mobile, location);
        userRepository.save(newUser);

        return true;
    }

    // ====== LOGIN ======
    public boolean login(String email, String password) {

        // Step 1: Input check
        if (ValidationUtil.isEmpty(email) || ValidationUtil.isEmpty(password)) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        // Step 2: Email দিয়ে user খোঁজো
        Optional<User> userOpt = userRepository.findByEmail(email);

        // Step 3: User পাওয়া না গেলে
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("No account found with this email.");
        }

        User user = userOpt.get();

        // Step 4: Password match check
        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("Incorrect password.");
        }

        // Step 5: Login সফল — currentUser set করো
        this.currentUser = user;
        return true;
    }

    // ====== LOGOUT ======
    public void logout() {
        this.currentUser = null;
    }

    // বর্তমান logged-in user পাওয়া
    public User getCurrentUser() {
        return currentUser;
    }

    // কেউ login করা আছে কিনা
    public boolean isLoggedIn() {
        return currentUser != null;
    }
}
```

**Register-এর ধাপগুলো:**

```
1. সব required field দেওয়া আছে?
2. Email format ঠিক আছে? (@ আছে? . আছে?)
3. Password কমপক্ষে ৬ character?
4. Mobile number ঠিক আছে? (যদি দেওয়া হয়)
5. এই email-এ আগে কেউ register করেছে?
6. সব ঠিক → Database-এ save করো
```

**Login-এর ধাপগুলো:**

```
1. Email ও password দেওয়া আছে?
2. Database-এ এই email-এ কোনো user আছে?
3. Password match করে?
4. সব ঠিক → currentUser set করো
```

**`throw new IllegalArgumentException(...)` কী?**

যদি কোনো validation fail করে, তখন exception throw করা হয়। Controller সেই exception catch করে user-কে error দেখায়।

```java
// Controller-এ:
try {
    authService.login(email, password);
    App.navigateTo("dashboard.fxml");
} catch (IllegalArgumentException e) {
    AlertUtil.showError(e.getMessage());  // Error message user-কে দেখাও
}
```

---

## 2. DonorService.java

Donor হওয়া ও Donor status manage করে।

```java
package com.bloodfinder.service;

import com.bloodfinder.model.Donor;
import com.bloodfinder.model.User;
import com.bloodfinder.model.enums.BloodType;
import com.bloodfinder.repository.DonorRepository;

import java.util.Optional;

public class DonorService {

    private static DonorService instance;
    private final DonorRepository donorRepository;

    private DonorService() {
        this.donorRepository = new DonorRepository();
    }

    public static DonorService getInstance() {
        if (instance == null) instance = new DonorService();
        return instance;
    }

    // User থেকে Donor হওয়া
    public Donor becomeDonor(User user, BloodType bloodType) {

        // Check: ইতিমধ্যে Donor কিনা
        Optional<Donor> existing = donorRepository.findByUserId(user.getId());
        if (existing.isPresent()) {
            throw new IllegalStateException("You are already a donor.");
        }

        // নতুন Donor object তৈরি
        Donor newDonor = new Donor(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPassword(),
            user.getMobile(),
            user.getLocation(),
            0,          // donorId — database দেবে
            bloodType,
            null,       // lastDonationDate — এখনো donate করেনি
            false       // isTempUnavailable — available
        );

        // Database-এ save করো
        donorRepository.save(newDonor);

        // Database থেকে আবার load করো (donorId পাওয়ার জন্য)
        return donorRepository.findByUserId(user.getId()).orElseThrow();
    }

    // Donor Status Remove করা
    public void removeDonorStatus(Donor donor) {
        donorRepository.delete(donor.getDonorId());
    }

    // Availability Toggle করা (Available ↔ Temp Unavailable)
    public void toggleAvailability(Donor donor) {
        donor.setTempUnavailable(!donor.isTempUnavailable());
        donorRepository.update(donor);
    }

    // Donor কিনা check করা
    public Optional<Donor> getDonorByUserId(int userId) {
        return donorRepository.findByUserId(userId);
    }

    // Donation করার পরে last_donation_date update করা
    public void recordDonation(Donor donor, String donationDate) {
        donor.setLastDonationDate(donationDate);
        donorRepository.update(donor);
    }
}
```

**`becomeDonor()` এর পরে আবার load করা কেন?**

```java
donorRepository.save(newDonor);  // Save করা হলো, কিন্তু donorId এখনো 0

// Database থেকে আবার load করো
return donorRepository.findByUserId(user.getId()).orElseThrow();
```

`save()` করার সময় `donorId = 0` ছিল কারণ database `AUTOINCREMENT` দিয়ে id দেবে। Save করার পরে database যে id দিয়েছে সেটা পেতে আবার load করতে হয়।

`.orElseThrow()` মানে — যদি Optional empty হয়, exception throw করো। এটা "এটা থাকার কথা" situation-এ use করি।

---

## 3. SearchService.java

Donor search করার service।

```java
package com.bloodfinder.service;

import com.bloodfinder.model.Donor;
import com.bloodfinder.model.enums.AvailabilityStatus;
import com.bloodfinder.model.enums.BloodType;
import com.bloodfinder.repository.DonorRepository;

import java.util.List;
import java.util.stream.Collectors;

public class SearchService {

    private static SearchService instance;
    private final DonorRepository donorRepository;

    private SearchService() {
        this.donorRepository = new DonorRepository();
    }

    public static SearchService getInstance() {
        if (instance == null) instance = new SearchService();
        return instance;
    }

    // Main search method — Blood Type ও Location দিয়ে filter
    public List<Donor> searchDonors(BloodType bloodType, String location) {

        // সব donor database থেকে আনো
        List<Donor> allDonors = donorRepository.findAll();

        // Stream API দিয়ে filter করো
        return allDonors.stream()

            // Filter 1: শুধু AVAILABLE donor রাখো
            .filter(donor ->
                donor.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE
            )

            // Filter 2: Blood type match করলে রাখো
            // bloodType null হলে সব blood type accept করো
            .filter(donor ->
                bloodType == null || donor.getBloodType() == bloodType
            )

            // Filter 3: Location match করলে রাখো
            // location null বা empty হলে সব location accept করো
            // case-insensitive contains check
            .filter(donor ->
                location == null ||
                location.trim().isEmpty() ||
                donor.getLocation().toLowerCase()
                     .contains(location.toLowerCase().trim())
            )

            // Stream → List
            .collect(Collectors.toList());
    }

    // Blood Type ছাড়া search (শুধু location দিয়ে)
    public List<Donor> searchByLocation(String location) {
        return searchDonors(null, location);
    }

    // Location ছাড়া search (শুধু Blood Type দিয়ে)
    public List<Donor> searchByBloodType(BloodType bloodType) {
        return searchDonors(bloodType, null);
    }

    // সব available donors
    public List<Donor> getAllAvailableDonors() {
        return searchDonors(null, null);
    }
}
```

**Stream Pipeline ব্যাখ্যা:**

```
allDonors (সব donor)
    ↓ filter: AVAILABLE only
[Rahim-A+, Karim-B+]  (UNAVAILABLE বাদ দেওয়া হয়েছে)
    ↓ filter: blood type = A+
[Rahim-A+]  (B+ বাদ দেওয়া হয়েছে)
    ↓ filter: location = "Dhaka"
[Rahim-A+]  (যে Dhaka-তে নেই বাদ দেওয়া হয়েছে)
    ↓ collect
List<Donor> = [Rahim]
```

**Lambda Expression:**
```java
donor -> donor.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE
```
- `donor` → lambda parameter (current element)
- `->` → lambda arrow
- পরেরটা → expression (true/false return করে)

C++ এ এটা হতো:
```cpp
[](Donor donor) { return donor.getAvailabilityStatus() == AVAILABLE; }
```

---

## 4. RequestService.java

Blood Request পাঠানো, Accept করা, Cancel করা।

```java
package com.bloodfinder.service;

import com.bloodfinder.model.BloodRequest;
import com.bloodfinder.model.DonationRecord;
import com.bloodfinder.model.Donor;
import com.bloodfinder.model.User;
import com.bloodfinder.model.enums.AvailabilityStatus;
import com.bloodfinder.model.enums.RequestStatus;
import com.bloodfinder.repository.DonationRecordRepository;
import com.bloodfinder.repository.RequestRepository;
import com.bloodfinder.util.DateUtil;
import com.bloodfinder.util.ValidationUtil;

import java.util.List;

public class RequestService {

    private static RequestService instance;
    private final RequestRepository requestRepository;
    private final DonationRecordRepository donationRecordRepository;
    private final DonorService donorService;

    private RequestService() {
        this.requestRepository = new RequestRepository();
        this.donationRecordRepository = new DonationRecordRepository();
        this.donorService = DonorService.getInstance();
    }

    public static RequestService getInstance() {
        if (instance == null) instance = new RequestService();
        return instance;
    }

    // ====== SEND REQUEST ======
    public BloodRequest sendRequest(User requester, Donor donor,
                                    String hospital, String neededDate, String reason) {

        // Validation
        if (ValidationUtil.isEmpty(hospital)) {
            throw new IllegalArgumentException("Hospital name is required.");
        }
        if (ValidationUtil.isEmpty(neededDate)) {
            throw new IllegalArgumentException("Needed date is required.");
        }

        // Donor available কিনা check
        if (donor.getAvailabilityStatus() != AvailabilityStatus.AVAILABLE) {
            throw new IllegalStateException("This donor is currently not available.");
        }

        // Requester নিজেই কি Donor? (নিজেকে request পাঠাতে পারবে না)
        // donorService দিয়ে check করা যায়, এখানে simple check
        if (requester.getId() == donor.getId()) {
            throw new IllegalArgumentException("You cannot send a request to yourself.");
        }

        // BloodRequest object তৈরি
        BloodRequest request = new BloodRequest(
            requester, donor, hospital, neededDate, reason
        );
        // Constructor-এ status=PENDING, createdAt=now() set হয়েছে

        // Database-এ save করো
        requestRepository.save(request);

        return request;
    }

    // ====== ACCEPT REQUEST ======
    public void acceptRequest(BloodRequest request) {

        // Request এখনো PENDING কিনা check
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("This request is no longer pending.");
        }

        // Step 1: Request status → ACCEPTED
        requestRepository.updateStatus(request.getId(), RequestStatus.ACCEPTED);

        // Step 2: DonationRecord তৈরি করো
        DonationRecord record = new DonationRecord(
            request.getDonor().getDonorId(),         // কোন donor
            request.getRequester().getName(),         // কাকে donate (নাম)
            request.getHospital(),                    // কোন hospital
            DateUtil.today()                          // আজকের তারিখ
        );
        donationRecordRepository.save(record);

        // Step 3: Donor-এর last_donation_date update করো
        donorService.recordDonation(request.getDonor(), DateUtil.today());

        // Step 4: অন্য সব PENDING request এই donor-এর কাছে → CANCELLED
        // (donate করে ফেলেছে, আর নিতে পারবে না ৩ মাস)
        List<BloodRequest> allPending = requestRepository
            .findByDonorId(request.getDonor().getDonorId());

        for (BloodRequest pendingReq : allPending) {
            if (pendingReq.getId() != request.getId() &&
                pendingReq.getStatus() == RequestStatus.PENDING) {
                requestRepository.updateStatus(pendingReq.getId(), RequestStatus.CANCELLED);
            }
        }
    }

    // ====== CANCEL REQUEST ======
    public void cancelRequest(BloodRequest request) {

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be cancelled.");
        }

        requestRepository.updateStatus(request.getId(), RequestStatus.CANCELLED);
    }

    // একটা donor-এর সব request দেখো
    public List<BloodRequest> getRequestsForDonor(int donorId) {
        return requestRepository.findByDonorId(donorId);
    }
}
```

**`acceptRequest()` এ কী কী হয়:**

```
1. Request PENDING আছে কিনা check
2. blood_requests table-এ status = ACCEPTED
3. donation_records-এ নতুন record INSERT
4. donors table-এ last_donation_date = আজকের তারিখ
5. এই donor-এর অন্য সব PENDING request → CANCELLED
```

এই পুরো কাজটা একটাই method-এ হয়। Controller শুধু `acceptRequest(request)` call করে — ভেতরের details জানে না।

---

## Service গুলোর মধ্যে সম্পর্ক

```
AuthService ──uses──► UserRepository
                      ↑
DonorService ─────────┘  ──uses──► DonorRepository
                              ↑
SearchService ────────────────┘

RequestService ──uses──► RequestRepository
               ──uses──► DonationRecordRepository
               ──uses──► DonorService  (recordDonation call করতে)
```

Service গুলো নিজেদের মধ্যে call করতে পারে (RequestService → DonorService)।

---

## Exception Handling Pattern

Service layer-এ `IllegalArgumentException` throw করা হয় validation fail হলে, Controller catch করে:

```java
// Service throws:
throw new IllegalArgumentException("Email already registered.");
throw new IllegalStateException("You are already a donor.");

// Controller catches:
try {
    authService.register(...);
    App.navigateTo("dashboard.fxml");
} catch (IllegalArgumentException e) {
    AlertUtil.showError(e.getMessage());
} catch (IllegalStateException e) {
    AlertUtil.showError(e.getMessage());
}
```

`IllegalArgumentException` → input ভুল (user-এর দোষ)
`IllegalStateException` → state ভুল (যেমন already a donor)
