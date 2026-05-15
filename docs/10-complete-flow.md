# 10 — Complete Flow: শুরু থেকে শেষ পর্যন্ত

> এই file-এ পুরো Blood Finder application-এর journey step-by-step দেখানো হয়েছে — code-সহ।
> Teacher যখন জিজ্ঞেস করবে "Blood Request পাঠালে exactly কী হয়?" — এই file দেখো।

---

## Overview: সম্পূর্ণ Journey

```
App Start
    ↓
[Login Screen]
    ↓ Register → [Register Screen] → Back to Login
    ↓ Login
[Dashboard]
    ↓ Search Donors    → [Donor Search] → [Donor Profile] → [Send Request]
    ↓ My Donor Profile → [Donor Profile] → Manage (Toggle/Remove)
    ↓ Become Donor     → [Become Donor Screen]
    ↓ Logout           → Back to Login
```

---

## Flow 1: Application Start

### কী হয়:
1. Maven `mvn javafx:run` চালায়
2. `App.main()` call হয়
3. JavaFX `launch()` call করে — `start()` method call হয়
4. `DatabaseManager.getInstance()` call হয়
5. SQLite file তৈরি হয়, tables তৈরি হয়
6. Login screen দেখা যায়

### Code:

```java
// App.java
public static void main(String[] args) {
    launch(args);           // JavaFX application শুরু করো
}

@Override
public void start(Stage stage) {
    primaryStage = stage;
    navigateTo("login.fxml");   // Login screen দেখাও
    stage.setTitle("Blood Finder");
    stage.show();
}
```

```java
// DatabaseManager.java — getInstance() first call হলে:
private DatabaseManager() {
    initializeDatabase();   // Connection তৈরি করো + Tables তৈরি করো
}
```

```sql
-- প্রথমবার run করলে এই SQL execute হয়:
CREATE TABLE IF NOT EXISTS users (...)
CREATE TABLE IF NOT EXISTS donors (...)
CREATE TABLE IF NOT EXISTS blood_requests (...)
CREATE TABLE IF NOT EXISTS donation_records (...)
```

---

## Flow 2: User Registration

### Scenario: Rahim নতুন account তৈরি করছে

**Step 1:** Login screen-এ "Register" click করে
```java
// LoginController.java
@FXML
private void handleRegister() {
    App.navigateTo("register.fxml");  // Register screen-এ যাও
}
```

**Step 2:** Register screen-এ form fill করে:
- Name: Rahim
- Email: rahim@test.com
- Password: pass123
- Confirm: pass123
- Mobile: 01711111111
- Location: Dhaka

**Step 3:** "Register" button click

```java
// RegisterController.java
@FXML
private void handleRegister() {
    // Form থেকে data নেওয়া
    String name     = nameField.getText().trim();      // "Rahim"
    String email    = emailField.getText().trim();     // "rahim@test.com"
    String password = passwordField.getText();         // "pass123"
    String confirm  = confirmPasswordField.getText();  // "pass123"

    // Password match check — Controller-এ
    if (!password.equals(confirm)) {
        errorLabel.setText("Passwords do not match.");
        return;
    }

    // Service-কে বলো register করতে
    authService.register(name, email, password, mobile, location);
}
```

**Step 4:** AuthService-এ validation

```java
// AuthService.java
public boolean register(String name, String email, ...) {

    // Validation 1: Empty check ✓
    // Validation 2: Email format ✓ (@ এবং . আছে)
    // Validation 3: Password length ✓ (6+ characters)
    // Validation 4: Mobile format ✓ (01xxxxxxxxx)
    // Validation 5: Email already exists?
    Optional<User> existing = userRepository.findByEmail("rahim@test.com");
    // → Optional.empty() — না, নেই, proceed করো

    // User object তৈরি করো
    User newUser = new User("Rahim", "rahim@test.com", "pass123", "01711111111", "Dhaka");

    // Database-এ save করো
    userRepository.save(newUser);
}
```

**Step 5:** UserRepository-তে SQL INSERT

```java
// UserRepository.java
public void save(User user) {
    String sql = "INSERT INTO users (name, email, password, mobile, location) VALUES (?, ?, ?, ?, ?)";
    PreparedStatement pstmt = connection.prepareStatement(sql);
    pstmt.setString(1, "Rahim");
    pstmt.setString(2, "rahim@test.com");
    pstmt.setString(3, "pass123");
    pstmt.setString(4, "01711111111");
    pstmt.setString(5, "Dhaka");
    pstmt.executeUpdate();
}
```

```sql
-- Database-এ এই query run হয়:
INSERT INTO users (name, email, password, mobile, location)
VALUES ('Rahim', 'rahim@test.com', 'pass123', '01711111111', 'Dhaka')

-- Result:
-- users table: id=1, name='Rahim', email='rahim@test.com', ...
```

**Step 6:** Success — Login screen-এ ফেরত

```java
AlertUtil.showSuccess("Registration successful! Please login.");
App.navigateTo("login.fxml");
```

---

## Flow 3: User Login

### Scenario: Rahim login করছে

**Step 1:** Email: rahim@test.com, Password: pass123, "Login" click

```java
// LoginController.java
@FXML
private void handleLogin() {
    String email = emailField.getText().trim();   // "rahim@test.com"
    String password = passwordField.getText();    // "pass123"

    try {
        authService.login(email, password);
        App.navigateTo("dashboard.fxml");         // সফল → Dashboard
    } catch (IllegalArgumentException e) {
        errorLabel.setText(e.getMessage());       // ব্যর্থ → error
    }
}
```

**Step 2:** AuthService login check

```java
// AuthService.java
public boolean login(String email, String password) {

    // Step 1: Empty check ✓
    // Step 2: Database-এ email খোঁজো
    Optional<User> userOpt = userRepository.findByEmail("rahim@test.com");
```

```sql
-- UserRepository-তে SQL:
SELECT * FROM users WHERE email = 'rahim@test.com'

-- Result:
-- id=1, name='Rahim', email='rahim@test.com', password='pass123', ...
```

```java
    // Step 3: User পাওয়া গেছে
    User user = userOpt.get();

    // Step 4: Password match?
    if (!user.getPassword().equals("pass123")) { // "pass123".equals("pass123") → true ✓
        throw new IllegalArgumentException("Incorrect password.");
    }

    // Step 5: Login সফল
    this.currentUser = user;  // Rahim এখন currentUser
    return true;
}
```

**Step 3:** Dashboard load হয়

```java
// DashboardController.java
@FXML
public void initialize() {
    User currentUser = authService.getCurrentUser();  // Rahim
    welcomeLabel.setText("Welcome, Rahim!");

    // Donor কিনা check করো
    Optional<Donor> donorOpt = donorService.getDonorByUserId(1);
    // → Optional.empty() — Rahim এখনো Donor না

    donorStatusLabel.setText("You are not a donor yet.");
    becomeDonorButton.setVisible(true);      // "Become Donor" দেখাও
    myDonorProfileButton.setVisible(false);  // "My Profile" লুকাও
}
```

---

## Flow 4: Donor হওয়া (Become Donor)

### Scenario: Rahim Donor হতে চায়

**Step 1:** Dashboard-এ "Become Donor" click → `become-donor.fxml` load হয়

**Step 2:** Blood Type: A+ select করে "Submit" click

```java
// BecomeDonorController.java
@FXML
private void handleBecomeDonor() {
    String selectedBT = "A+";

    // "A+" → BloodType.A_POS
    BloodType bloodType = null;
    for (BloodType bt : BloodType.values()) {
        if (bt.getDisplayName().equals("A+")) {
            bloodType = bt;  // BloodType.A_POS
            break;
        }
    }

    User currentUser = authService.getCurrentUser();  // Rahim

    donorService.becomeDonor(currentUser, BloodType.A_POS);
}
```

**Step 3:** DonorService-এ logic

```java
// DonorService.java
public Donor becomeDonor(User user, BloodType bloodType) {

    // Already Donor কিনা check
    Optional<Donor> existing = donorRepository.findByUserId(1);
    // → Optional.empty() — না, proceed করো

    // Donor object তৈরি
    Donor newDonor = new Donor(
        1,              // user id
        "Rahim",
        "rahim@test.com",
        "pass123",
        "01711111111",
        "Dhaka",
        0,              // donorId = 0 (database দেবে)
        BloodType.A_POS,
        null,           // lastDonationDate = null
        false           // isTempUnavailable = false
    );

    donorRepository.save(newDonor);

    // Database থেকে আবার load করো — donorId পাওয়ার জন্য
    return donorRepository.findByUserId(1).orElseThrow();
}
```

**Step 4:** DonorRepository SQL INSERT

```sql
INSERT INTO donors (user_id, blood_type, last_donation_date, is_temp_unavailable)
VALUES (1, 'A_POS', NULL, 0)

-- Result:
-- donors table: id=1, user_id=1, blood_type='A_POS', last_donation_date=NULL, is_temp_unavailable=0
```

**Step 5:** Dashboard-এ ফেরত — এখন Donor status দেখাবে

---

## Flow 5: Donor Search

### Scenario: Karim (অন্য user, register করা আছে) A+ blood খুঁজছে Dhaka-তে

**Step 1:** Dashboard → "Search Donors" → `donor-search.fxml`

**Step 2:** Blood Type: A+, Location: Dhaka, "Search" click

```java
// DonorSearchController.java
@FXML
private void handleSearch() {
    BloodType bloodType = BloodType.A_POS;  // "A+" → Enum
    String location = "Dhaka";

    loadDonors(bloodType, location);
}

private void loadDonors(BloodType bloodType, String location) {
    List<Donor> results = searchService.searchDonors(BloodType.A_POS, "Dhaka");
    donorListView.setItems(FXCollections.observableArrayList(results));
    resultCountLabel.setText(results.size() + " donor(s) found");
}
```

**Step 3:** SearchService-এ Stream pipeline

```java
// SearchService.java
public List<Donor> searchDonors(BloodType bloodType, String location) {

    // সব donor আনো
    List<Donor> allDonors = donorRepository.findAll();
    // allDonors = [Donor{Rahim, A_POS, Dhaka, AVAILABLE}]
    // (ধরো এখন শুধু Rahim একজন donor)

    return allDonors.stream()

        // Filter 1: AVAILABLE?
        // Rahim: isTempUnavailable=false, lastDonationDate=null → AVAILABLE ✓
        .filter(d -> d.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE)

        // Filter 2: Blood type = A_POS?
        // Rahim: bloodType=A_POS == A_POS → ✓
        .filter(d -> d.getBloodType() == BloodType.A_POS)

        // Filter 3: Location contains "Dhaka"?
        // Rahim: "dhaka".contains("dhaka") → ✓
        .filter(d -> d.getLocation().toLowerCase().contains("dhaka"))

        .collect(Collectors.toList());
    // Result: [Rahim]
}
```

**Step 4:** DonorRepository-তে SQL (JOIN)

```sql
SELECT d.*, u.name, u.email, u.password, u.mobile, u.location
FROM donors d
JOIN users u ON d.user_id = u.id

-- Result:
-- id=1, user_id=1, blood_type='A_POS', ..., name='Rahim', email='rahim@test.com', location='Dhaka'
```

**Step 5:** ListView-এ result দেখায়: "Rahim — A+ — Dhaka"

---

## Flow 6: Donor Profile দেখা

**Step 1:** ListView-এ Rahim select করে "View Profile" click

```java
// DonorSearchController.java
@FXML
private void handleViewProfile() {
    Donor selected = donorListView.getSelectionModel().getSelectedItem();
    // selected = Donor{Rahim, A_POS, Dhaka}

    DataHolder.setSelectedDonor(selected);  // DataHolder-এ রেখে দাও
    App.navigateTo("donor-profile.fxml");
}
```

**Step 2:** DonorProfileController load হয়

```java
// DonorProfileController.java
@FXML
public void initialize() {
    User currentUser = authService.getCurrentUser();  // Karim (login করা)

    Donor donorFromHolder = DataHolder.getSelectedDonor();  // Rahim
    viewingDonor = donorFromHolder;     // Rahim-এর profile দেখছি
    isOwnProfile = false;               // Karim != Rahim
    DataHolder.clear();

    // Labels set করো
    nameLabel.setText("Rahim");
    bloodTypeLabel.setText("A+");
    locationLabel.setText("Dhaka");
    availabilityLabel.setText("Available");
    lastDonationLabel.setText("No donation recorded");

    // Karim অন্যের profile দেখছে → Request button দেখাও
    sendRequestButton.setVisible(true);          // ✓ দেখাও
    toggleAvailabilityButton.setVisible(false);  // লুকাও (নিজের না)
    removeDonorStatusButton.setVisible(false);   // লুকাও (নিজের না)
}
```

---

## Flow 7: Blood Request পাঠানো

### Scenario: Karim, Rahim-কে Blood Request পাঠাচ্ছে

**Step 1:** Donor Profile-এ "Send Request" click

```java
// DonorProfileController.java
@FXML
private void handleSendRequest() {
    DataHolder.setSelectedDonor(viewingDonor);  // Rahim কে DataHolder-এ রাখো
    App.navigateTo("request.fxml");
}
```

**Step 2:** RequestController load হয়

```java
// RequestController.java
@FXML
public void initialize() {
    targetDonor = DataHolder.getSelectedDonor();  // Rahim
    DataHolder.clear();
    sendRequestForm.setVisible(true);             // Send form দেখাও
    donorNameLabel.setText("Sending request to: Rahim");
}
```

**Step 3:** Form fill করে "Send" click:
- Hospital: Dhaka Medical College
- Needed Date: 2024-03-20
- Reason: Emergency surgery

```java
// RequestController.java
@FXML
private void handleSendRequest() {
    User currentUser = authService.getCurrentUser();  // Karim
    String hospital   = "Dhaka Medical College";
    String neededDate = "2024-03-20";
    String reason     = "Emergency surgery";

    requestService.sendRequest(currentUser, targetDonor, hospital, neededDate, reason);
}
```

**Step 4:** RequestService validation ও save

```java
// RequestService.java
public BloodRequest sendRequest(User requester, Donor donor, ...) {

    // Validation: hospital খালি? না ✓
    // Validation: date দেওয়া? হ্যাঁ ✓
    // Donor available? Rahim: AVAILABLE ✓
    // নিজেকে request? Karim.id(2) != Rahim.id(1) ✓

    // BloodRequest তৈরি করো
    BloodRequest request = new BloodRequest(
        requester,      // Karim
        donor,          // Rahim
        "Dhaka Medical College",
        "2024-03-20",
        "Emergency surgery"
    );
    // Constructor-এ: status=PENDING, createdAt="2024-03-15 10:30:00"

    requestRepository.save(request);
}
```

**Step 5:** RequestRepository SQL INSERT

```sql
INSERT INTO blood_requests
(requester_id, donor_id, hospital, needed_date, reason, status, created_at)
VALUES (2, 1, 'Dhaka Medical College', '2024-03-20', 'Emergency surgery', 'PENDING', '2024-03-15 10:30:00')

-- Result:
-- blood_requests: id=1, requester_id=2, donor_id=1, ..., status='PENDING'
```

---

## Flow 8: Request Accept করা

### Scenario: Rahim login করে, Karim-এর request accept করছে

**Step 1:** Rahim login করে Dashboard-এ যায়

**Step 2:** Dashboard থেকে "My Donor Profile" → incoming requests দেখে

**Step 3:** Karim-এর request select করে "Accept" click

```java
// RequestController.java
@FXML
private void handleAcceptRequest() {
    BloodRequest selected = requestsListView.getSelectionModel().getSelectedItem();
    // selected = BloodRequest{Karim→Rahim, hospital="Dhaka Medical", status=PENDING}

    requestService.acceptRequest(selected);
}
```

**Step 4:** RequestService-এ acceptRequest() — সবচেয়ে complex step

```java
// RequestService.java
public void acceptRequest(BloodRequest request) {

    // Check: PENDING আছে? হ্যাঁ ✓

    // ===== Step A: Request status → ACCEPTED =====
    requestRepository.updateStatus(request.getId(), RequestStatus.ACCEPTED);
```
```sql
    -- SQL:
    UPDATE blood_requests SET status = 'ACCEPTED' WHERE id = 1
```

```java
    // ===== Step B: DonationRecord তৈরি করো =====
    DonationRecord record = new DonationRecord(
        request.getDonor().getDonorId(),    // 1 (Rahim-এর donorId)
        request.getRequester().getName(),   // "Karim"
        request.getHospital(),             // "Dhaka Medical College"
        DateUtil.today()                   // "2024-03-15"
    );
    donationRecordRepository.save(record);
```
```sql
    -- SQL:
    INSERT INTO donation_records (donor_id, requester_name, hospital, donation_date)
    VALUES (1, 'Karim', 'Dhaka Medical College', '2024-03-15')
```

```java
    // ===== Step C: Donor-এর last_donation_date update করো =====
    donorService.recordDonation(request.getDonor(), "2024-03-15");
```
```sql
    -- SQL:
    UPDATE donors SET last_donation_date = '2024-03-15' WHERE id = 1
```

```java
    // ===== Step D: অন্য PENDING requests → CANCELLED =====
    List<BloodRequest> allPending = requestRepository.findByDonorId(1);
    for (BloodRequest pendingReq : allPending) {
        if (pendingReq.getId() != request.getId() &&
            pendingReq.getStatus() == RequestStatus.PENDING) {
            requestRepository.updateStatus(pendingReq.getId(), RequestStatus.CANCELLED);
        }
    }
}
```

**Step 5: Accept করার পরে Database State**

```
users table:
  id=1, name='Rahim', ...

donors table:
  id=1, user_id=1, blood_type='A_POS', last_donation_date='2024-03-15', is_temp_unavailable=0

blood_requests table:
  id=1, requester_id=2, donor_id=1, status='ACCEPTED', ...

donation_records table:
  id=1, donor_id=1, requester_name='Karim', hospital='Dhaka Medical College', donation_date='2024-03-15'
```

**Step 6: Rahim এখন কী হলো?**

```java
// Rahim-এর availability:
donor.getAvailabilityStatus()

// isTempUnavailable = false
// lastDonationDate = "2024-03-15"
// DateUtil.isWithin3Months("2024-03-15") → true (৩ মাস হয়নি)
// → AvailabilityStatus.UNAVAILABLE
```

পরের ৩ মাস Rahim কোনো search result-এ দেখাবে না।

---

## Complete Database State Diagram

```
সব flow শেষ হওয়ার পরে Database:

users:
┌─────┬────────┬──────────────────┬──────────┬─────────────┬────────┐
│ id  │ name   │ email            │ password │ mobile      │location│
├─────┼────────┼──────────────────┼──────────┼─────────────┼────────┤
│  1  │ Rahim  │ rahim@test.com   │ pass123  │ 01711111111 │ Dhaka  │
│  2  │ Karim  │ karim@test.com   │ pass456  │ 01722222222 │ Dhaka  │
└─────┴────────┴──────────────────┴──────────┴─────────────┴────────┘

donors:
┌─────┬─────────┬────────────┬────────────────────┬────────────────────┐
│ id  │ user_id │ blood_type │ last_donation_date │ is_temp_unavailable│
├─────┼─────────┼────────────┼────────────────────┼────────────────────┤
│  1  │    1    │ A_POS      │ 2024-03-15         │          0         │
└─────┴─────────┴────────────┴────────────────────┴────────────────────┘

blood_requests:
┌────┬──────────────┬──────────┬─────────────────────┬────────────┬────────────┐
│ id │ requester_id │ donor_id │ hospital            │ status     │ created_at │
├────┼──────────────┼──────────┼─────────────────────┼────────────┼────────────┤
│  1 │      2       │    1     │ Dhaka Medical Coll. │ ACCEPTED   │ 2024-03-15 │
└────┴──────────────┴──────────┴─────────────────────┴────────────┴────────────┘

donation_records:
┌────┬──────────┬────────────────┬─────────────────────┬───────────────┐
│ id │ donor_id │ requester_name │ hospital            │ donation_date │
├────┼──────────┼────────────────┼─────────────────────┼───────────────┤
│  1 │    1     │ Karim          │ Dhaka Medical Coll. │ 2024-03-15    │
└────┴──────────┴────────────────┴─────────────────────┴───────────────┘
```

---

## সব Flow একসাথে — Code Call Chain

```
Register:
  RegisterController.handleRegister()
    → AuthService.register()
      → ValidationUtil.isValidEmail()
      → UserRepository.findByEmail()  [SELECT]
      → UserRepository.save()         [INSERT]

Login:
  LoginController.handleLogin()
    → AuthService.login()
      → UserRepository.findByEmail()  [SELECT]
      → password check

Become Donor:
  BecomeDonorController.handleBecomeDonor()
    → DonorService.becomeDonor()
      → DonorRepository.findByUserId() [SELECT - check duplicate]
      → DonorRepository.save()         [INSERT]
      → DonorRepository.findByUserId() [SELECT - get donorId]

Search:
  DonorSearchController.handleSearch()
    → SearchService.searchDonors()
      → DonorRepository.findAll()      [SELECT JOIN]
      → Stream.filter (AVAILABLE + bloodType + location)

Send Request:
  RequestController.handleSendRequest()
    → RequestService.sendRequest()
      → ValidationUtil checks
      → donor.getAvailabilityStatus() check
      → RequestRepository.save()       [INSERT]

Accept Request:
  RequestController.handleAcceptRequest()
    → RequestService.acceptRequest()
      → RequestRepository.updateStatus()      [UPDATE status=ACCEPTED]
      → DonationRecordRepository.save()       [INSERT]
      → DonorService.recordDonation()
          → DonorRepository.update()          [UPDATE last_donation_date]
      → RequestRepository.findByDonorId()     [SELECT other pending]
      → RequestRepository.updateStatus()×N    [UPDATE status=CANCELLED]
```

---

## Teacher-কে Explain করার Tips

**Q: "MVC pattern কীভাবে use করেছ?"**
> "আমাদের project-এ Model layer-এ User, Donor class আছে যেগুলো শুধু data রাখে। View layer-এ FXML files আছে — login.fxml, dashboard.fxml — এগুলো UI দেখায়। Controller layer-এ LoginController, DashboardController — এরা FXML আর Service-এর মাঝে কাজ করে। আর আমরা দুটো extra layer যোগ করেছি — Service (business logic) আর Repository (database operation)।"

**Q: "Singleton কোথায় use করেছ?"**
> "DatabaseManager, AuthService, DonorService, SearchService, RequestService — এই পাঁচটা class Singleton। DatabaseManager Singleton করা হয়েছে কারণ database connection একটাই থাকা উচিত। Service গুলো Singleton কারণ এদের state থাকে — AuthService-এ currentUser থাকে।"

**Q: "Inheritance কীভাবে use করেছ?"**
> "Donor class User-কে extend করেছে। User-এর সব field — name, email, password, mobile, location — Donor automatically পেয়েছে। তার উপরে Donor-এর নিজস্ব field আছে — donorId, bloodType, lastDonationDate, isTempUnavailable।"

**Q: "Stream API কোথায় use করেছ?"**
> "SearchService.searchDonors() method-এ। সব Donor database থেকে আনার পরে Stream API দিয়ে তিনটা filter করা হয় — availability check, blood type match, location match। এটা traditional for loop দিয়েও করা যেত, কিন্তু Stream API দিয়ে একটা pipeline-এ সব কাজ করা যায়।"
