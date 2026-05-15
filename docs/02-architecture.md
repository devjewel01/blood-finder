# 02 — Architecture: Project কীভাবে সাজানো আছে

---

## MVC Pattern কী?

**MVC** মানে **Model — View — Controller**।

এটা একটা design pattern — মানে code organize করার একটা নিয়ম। এই নিয়ম মেনে চললে code পড়া সহজ হয়, maintain করা সহজ হয়।

সহজ ভাষায় বুঝি:

| অংশ | কাজ | আমাদের Project-এ |
|-----|-----|-----------------|
| **Model** | Data রাখে | `User`, `Donor`, `BloodRequest` class |
| **View** | যা user দেখে | `.fxml` files (Login screen, Dashboard, ইত্যাদি) |
| **Controller** | Model ও View-এর মাঝে সংযোগ | `LoginController`, `DashboardController`, ইত্যাদি |

### উদাহরণ দিয়ে বুঝি:

```
User "Search" button click করলো
        ↓
View (FXML) → Controller জানালো
        ↓
Controller → Service call করলো
        ↓
Service → Repository call করলো
        ↓
Repository → Database-এ query চালালো
        ↓
Data ফেরত এলো → Controller → View update হলো
```

এখানে **View** জানে না database-এ কী আছে। **Model** জানে না screen-এ কী দেখাচ্ছে। **Controller** শুধু মাঝখানে কাজ করে।

---

## আমাদের Extended MVC

শুধু MVC নয়, আমরা আরও দুটো layer যোগ করেছি:

```
View (FXML)
    ↕
Controller
    ↕
Service         ← Business Logic (নিয়মকানুন)
    ↕
Repository      ← Database Operation
    ↕
Model           ← Data Structure
    ↕
Database (SQLite)
```

### প্রতিটি Layer-এর কাজ:

**Model Layer:**
- শুধু data hold করে
- কোনো database বা UI কাজ করে না
- Example: `User` class-এ name, email, password — এগুলো রাখে

**Repository Layer:**
- Database-এর সাথে সরাসরি কথা বলে
- SQL query চালায়
- Model object তৈরি করে return করে
- Example: `UserRepository.findByEmail("test@test.com")` → database থেকে User খুঁজে আনে

**Service Layer:**
- Business logic থাকে — মানে "নিয়ম" থাকে
- Example: Login করতে হলে email ও password দুটোই match করতে হবে — এই নিয়ম `AuthService`-এ আছে
- Repository call করে, result check করে, সিদ্ধান্ত নেয়

**Controller Layer:**
- User-এর action (button click, form submit) handle করে
- Service call করে
- Result অনুযায়ী View update করে বা নতুন screen খোলে

**View Layer (FXML):**
- শুধু UI design — কোনো logic নেই
- Button, TextField, Label — এগুলো FXML-এ define করা

---

## Project Folder Structure

```
blood-finder/
│
├── pom.xml                          ← Maven configuration file
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/bloodfinder/
│       │       │
│       │       ├── App.java                    ← Application entry point
│       │       │
│       │       ├── model/                      ← Model Layer
│       │       │   ├── User.java
│       │       │   ├── Donor.java
│       │       │   ├── BloodRequest.java
│       │       │   ├── DonationRecord.java
│       │       │   └── enums/
│       │       │       ├── BloodType.java
│       │       │       ├── RequestStatus.java
│       │       │       └── AvailabilityStatus.java
│       │       │
│       │       ├── repository/                 ← Repository Layer
│       │       │   ├── Repository.java         ← Interface (Generic)
│       │       │   ├── UserRepository.java
│       │       │   ├── DonorRepository.java
│       │       │   ├── RequestRepository.java
│       │       │   └── DonationRecordRepository.java
│       │       │
│       │       ├── service/                    ← Service Layer
│       │       │   ├── AuthService.java
│       │       │   ├── DonorService.java
│       │       │   ├── SearchService.java
│       │       │   └── RequestService.java
│       │       │
│       │       ├── controller/                 ← Controller Layer
│       │       │   ├── LoginController.java
│       │       │   ├── RegisterController.java
│       │       │   ├── DashboardController.java
│       │       │   ├── DonorSearchController.java
│       │       │   ├── DonorProfileController.java
│       │       │   ├── RequestController.java
│       │       │   └── BecomeDonorController.java
│       │       │
│       │       ├── database/                   ← Database Manager
│       │       │   └── DatabaseManager.java
│       │       │
│       │       └── util/                       ← Utility Classes
│       │           ├── DateUtil.java
│       │           ├── ValidationUtil.java
│       │           ├── AlertUtil.java
│       │           └── DataHolder.java
│       │
│       └── resources/
│           └── com/bloodfinder/
│               ├── login.fxml
│               ├── register.fxml
│               ├── dashboard.fxml
│               ├── donor-search.fxml
│               ├── donor-profile.fxml
│               ├── request.fxml
│               └── become-donor.fxml
│
└── blood_finder.db                  ← SQLite database (auto-created)
```

---

## Data Flow Diagram (কীভাবে data চলাচল করে)

### Flow 1: User Login

```
[Login Screen - login.fxml]
    User email ও password type করে "Login" button click করে
                    |
                    ▼
[LoginController.java - handleLogin() method]
    TextField থেকে email ও password নেয়
    ValidationUtil দিয়ে empty check করে
                    |
                    ▼
[AuthService.java - login(email, password) method]
    Business rule check করে
                    |
                    ▼
[UserRepository.java - findByEmail(email) method]
    SQL: SELECT * FROM users WHERE email = ?
                    |
                    ▼
[DatabaseManager.java]
    SQLite-এ actual query চালায়
                    |
                    ▼
    User object তৈরি হয়ে ফেরত আসে
                    |
                    ▼
[AuthService]
    Password match করে, login confirm করে
                    |
                    ▼
[LoginController]
    Dashboard screen-এ navigate করে
                    |
                    ▼
[Dashboard Screen - dashboard.fxml]
    User-এর নাম, options দেখায়
```

---

### Flow 2: Blood Request পাঠানো

```
[DonorProfileController]
    "Send Request" button click
                    |
                    ▼
[RequestController - handleSendRequest()]
    Form data (hospital, date, reason) নেয়
                    |
                    ▼
[RequestService - sendRequest()]
    Validation করে, BloodRequest object তৈরি করে
                    |
                    ▼
[RequestRepository - save()]
    SQL INSERT into blood_requests
                    |
                    ▼
    Database-এ save হয়
```

---

### Flow 3: Donor Search

```
[DonorSearchController - handleSearch()]
    Blood Type ও Location নেয়
                    |
                    ▼
[SearchService - searchDonors(bloodType, location)]
    সব donor load করে, Stream API দিয়ে filter করে
                    |
                    ▼
[DonorRepository - findAll()]
    SQL: SELECT * FROM donors JOIN users ON ...
                    |
                    ▼
    List<Donor> ফেরত আসে → Stream filter → matched donors
                    |
                    ▼
[DonorSearchController]
    TableView বা ListView-এ result দেখায়
```

---

## Package কেন আলাদা করা হয়েছে?

**Separation of Concerns** — প্রতিটি package-এর একটাই দায়িত্ব।

| Package | দায়িত্ব | অন্য কোথায় যায় না |
|---------|---------|-----------------|
| `model` | শুধু data রাখে | DB জানে না, UI জানে না |
| `repository` | শুধু DB কাজ | Business rule জানে না |
| `service` | শুধু logic | UI জানে না |
| `controller` | UI ও Service connect | DB সরাসরি জানে না |
| `util` | Helper tools | সব জায়গায় use হয় |

এই structure follow করলে:
- একটা জায়গায় bug হলে সহজে খুঁজে পাওয়া যায়
- একজন teammate model নিয়ে কাজ করতে পারে, আরেকজন controller নিয়ে — conflict কম হয়
- Code পড়তে সহজ লাগে

---

## App.java — Entry Point

```java
public class App extends Application {

    private static Stage primaryStage;

    @Override
    public void start(Stage stage) {
        primaryStage = stage;
        navigateTo("login.fxml");        // প্রথমে login screen দেখাও
        stage.setTitle("Blood Finder");
        stage.show();
    }

    // যেকোনো screen থেকে যেকোনো screen-এ যেতে এই method call করে
    public static void navigateTo(String fxmlName) {
        try {
            FXMLLoader loader = new FXMLLoader(
                App.class.getResource(fxmlName)
            );
            Scene scene = new Scene(loader.load());
            primaryStage.setScene(scene);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        launch(args);   // JavaFX application শুরু করে
    }
}
```

**ব্যাখ্যা:**
- `App extends Application` — JavaFX application শুরু করতে এই class extend করতে হয়
- `start()` method JavaFX automatically call করে — এটাই main entry point
- `navigateTo()` method static কারণ যেকোনো Controller এটা `App.navigateTo("screen.fxml")` দিয়ে call করতে পারে
- `Stage` মানে Window — OS-এর window
- `Scene` মানে window-এর ভেতরের content
