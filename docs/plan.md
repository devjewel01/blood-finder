# Blood Finder — Implementation Plan

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | Java 17+ |
| UI Framework | JavaFX (FXML + CSS) |
| Database | SQLite |
| Build Tool | Maven |
| Architecture | MVC (Model-View-Controller) |

---

## Project Structure

```
blood-finder/
├── src/
│   └── bloodfinder/
│       ├── App.java                          # Application entry point
│       │
│       ├── model/                            # Data classes
│       │   ├── User.java                     # Base class (Encapsulation)
│       │   ├── Donor.java                    # extends User (Inheritance)
│       │   ├── BloodRequest.java
│       │   ├── DonationRecord.java
│       │   └── enums/
│       │       ├── BloodType.java            # A+, B-, O+ ...
│       │       ├── RequestStatus.java        # PENDING, ACCEPTED, CANCELLED
│       │       └── AvailabilityStatus.java   # AVAILABLE, UNAVAILABLE, TEMP_UNAVAILABLE
│       │
│       ├── repository/                       # Data Access Layer
│       │   ├── Repository.java               # Generic Interface<T> (Abstraction)
│       │   ├── UserRepository.java
│       │   ├── DonorRepository.java
│       │   └── RequestRepository.java
│       │
│       ├── service/                          # Business Logic
│       │   ├── AuthService.java              # Login, Register, Session
│       │   ├── DonorService.java             # Donor management, availability
│       │   ├── SearchService.java            # Search & filter
│       │   └── RequestService.java           # Blood request handling
│       │
│       ├── controller/                       # JavaFX Controllers
│       │   ├── LoginController.java
│       │   ├── RegisterController.java
│       │   ├── DashboardController.java
│       │   ├── DonorSearchController.java
│       │   ├── DonorProfileController.java
│       │   └── RequestController.java
│       │
│       ├── database/
│       │   └── DatabaseManager.java          # Singleton Pattern
│       │
│       └── util/
│           ├── DateUtil.java                 # Date calculations
│           └── ValidationUtil.java           # Input validation
│
├── resources/
│   ├── fxml/                                 # UI layouts
│   │   ├── login.fxml
│   │   ├── register.fxml
│   │   ├── dashboard.fxml
│   │   ├── donor-search.fxml
│   │   ├── donor-profile.fxml
│   │   └── request-form.fxml
│   └── styles/
│       └── style.css
│
└── pom.xml                                   # Maven build file
```

---

## Architecture (MVC Pattern)

```
┌─────────────────────────────────────────────────┐
│                  VIEW (FXML + CSS)                │
│  login.fxml   register.fxml   donor-search.fxml  │
└──────────────────────┬──────────────────────────┘
                       │ user interaction
                       ▼
┌─────────────────────────────────────────────────┐
│                   CONTROLLER                      │
│  LoginController   DonorSearchController   ...   │
└──────────────────────┬──────────────────────────┘
                       │ calls
                       ▼
┌─────────────────────────────────────────────────┐
│                    SERVICE                        │
│  AuthService   DonorService   SearchService  ... │
│  (Business Logic: 3-month check, filtering)      │
└──────────────────────┬──────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────┐
│                  REPOSITORY                       │
│  Repository<T> interface                          │
│  UserRepository   DonorRepository   ...          │
└──────────────────────┬──────────────────────────┘
                       │ SQL queries
                       ▼
┌─────────────────────────────────────────────────┐
│            DATABASE (SQLite - Singleton)           │
│                 blood_finder.db                    │
└─────────────────────────────────────────────────┘
```

---

## OOP Concepts Map

| OOP Concept | কোথায় ব্যবহার হবে | উদাহরণ |
|---|---|---|
| **Encapsulation** | Model classes | `private String name;` + `getName()`, `setName()` |
| **Inheritance** | `Donor extends User` | Donor এ User এর সব property + blood type |
| **Polymorphism** | `toString()` override | User আর Donor এর আলাদা `toString()` |
| **Abstraction** | `Repository<T>` interface | Common methods, আলাদা implementation |
| **Interface** | Repository | `findById()`, `save()`, `delete()`, `findAll()` |
| **Enum** | BloodType, RequestStatus | `BloodType.A_POSITIVE`, `RequestStatus.PENDING` |
| **Composition** | Service classes | `DonorService` এর মধ্যে `DonorRepository` থাকে |
| **Singleton** | DatabaseManager | একটাই database connection |
| **Generics** | `Repository<T>` | Type-safe repository |
| **Collections** | Search, Filter | `List<Donor>`, `Map<BloodType, List<Donor>>` |
| **Exception Handling** | Custom exceptions | `UserNotFoundException`, `InvalidCredentialException` |

---

## Database Schema

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    mobile TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    blood_type TEXT NOT NULL,
    last_donation_date TEXT,
    is_temporarily_unavailable INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blood_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL REFERENCES users(id),
    donor_id INTEGER NOT NULL REFERENCES donors(id),
    hospital TEXT NOT NULL,
    needed_date TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'PENDING',
    cancel_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donation_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_id INTEGER NOT NULL REFERENCES donors(id),
    request_id INTEGER NOT NULL REFERENCES blood_requests(id),
    donation_date TEXT NOT NULL,
    hospital TEXT NOT NULL,
    requester_name TEXT NOT NULL
);

CREATE TABLE hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL
);
```

---

## Implementation Steps

| Step | কী করবে | কোন OOP concept শিখবে |
|------|---------|----------------------|
| **Step 1** | Project setup — Maven + dependencies | Project structure, build tool |
| **Step 2** | Model classes + Enums তৈরি | Encapsulation, Inheritance, Enum |
| **Step 3** | DatabaseManager (Singleton) + table creation | Singleton pattern, SQL basics |
| **Step 4** | Repository interface + implementations | Interface, Generics, Abstraction |
| **Step 5** | Service classes তৈরি | Composition, Business logic |
| **Step 6** | Login/Register UI + Controller | MVC pattern, JavaFX basics |
| **Step 7** | Dashboard + Become a Donor | Scene navigation, role management |
| **Step 8** | Donor Search + Filter | Collections, Stream API, Filtering |
| **Step 9** | Blood Request system | Full request flow |
| **Step 10** | Notification + Donation History | Auto-update, history tracking |
| **Step 11** | Styling + Final polish | CSS, user experience |

---

## Dependencies (Maven)

```xml
<!-- JavaFX -->
javafx-controls, javafx-fxml (v21+)

<!-- SQLite -->
org.xerial:sqlite-jdbc (v3.45+)
```

---

## কীভাবে কাজ করব
- প্রতিটা step আমরা একসাথে বসে implement করব
- প্রতি step শেষে run করে test করব
- প্রতিটা step এ কোন OOP concept শিখছি সেটা বুঝে নেব
- সব শেষে full flow test: Register → Login → Become Donor → Search → Request → Accept
