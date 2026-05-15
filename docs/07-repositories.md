# 07 — Repositories: Database Operation গুলো

---

## Repository Pattern কী?

**Repository Pattern** একটা design pattern যেটা database operation গুলোকে আলাদা class-এ রাখে।

কেন আলাদা class-এ রাখবো?

```
Without Repository (bad):
Service → সরাসরি SQL লেখে
Controller → সরাসরি SQL লেখে
→ SQL code সব জায়গায় ছড়িয়ে যায়

With Repository (good):
Service → Repository.findByEmail()
Controller → কিছু জানে না
Repository → SQL লেখে
→ SQL শুধু Repository-তে, বাকি সব Java
```

Repository হলো database-এর "দরজা"। শুধু Repository-ই সরাসরি database ছোঁয়।

---

## Repository\<T\> Interface

```java
package com.bloodfinder.repository;

import java.util.List;
import java.util.Optional;

// T = Generic Type। User, Donor, BloodRequest — যেকোনো type হতে পারে
public interface Repository<T> {

    // নতুন record save করো
    void save(T entity);

    // id দিয়ে একটা record খোঁজো
    // Optional<T> — হয়তো পাবে, হয়তো পাবে না
    Optional<T> findById(int id);

    // সব records-এর list
    List<T> findAll();

    // existing record update করো
    void update(T entity);

    // id দিয়ে record delete করো
    void delete(int id);
}
```

**`Optional<T>` কী?**

`Optional` Java 8-এ আসা একটা wrapper class। যখন result থাকতেও পারে, না-ও পারে, তখন use করি।

```java
Optional<User> result = userRepo.findById(5);

// Check করো কিছু পাওয়া গেছে কিনা
if (result.isPresent()) {
    User user = result.get();
    System.out.println(user.getName());
} else {
    System.out.println("User not found");
}

// বা shorter:
result.ifPresent(user -> System.out.println(user.getName()));
```

C++ এ `std::optional<T>` এর মতো।

---

## 1. UserRepository.java

```java
package com.bloodfinder.repository;

import com.bloodfinder.database.DatabaseManager;
import com.bloodfinder.model.User;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UserRepository implements Repository<User> {

    private final Connection connection;

    public UserRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    // নতুন user insert করো
    @Override
    public void save(User user) {
        String sql = "INSERT INTO users (name, email, password, mobile, location) " +
                     "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, user.getName());
            pstmt.setString(2, user.getEmail());
            pstmt.setString(3, user.getPassword());
            pstmt.setString(4, user.getMobile());
            pstmt.setString(5, user.getLocation());
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // id দিয়ে user খোঁজো
    @Override
    public Optional<User> findById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                return Optional.of(mapToUser(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return Optional.empty();  // পাওয়া যায়নি
    }

    // email দিয়ে user খোঁজো (Login-এর সময় use হয়)
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, email);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                return Optional.of(mapToUser(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return Optional.empty();
    }

    // সব users-এর list
    @Override
    public List<User> findAll() {
        List<User> users = new ArrayList<>();
        String sql = "SELECT * FROM users";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                users.add(mapToUser(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return users;
    }

    // user update করো
    @Override
    public void update(User user) {
        String sql = "UPDATE users SET name=?, mobile=?, location=? WHERE id=?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, user.getName());
            pstmt.setString(2, user.getMobile());
            pstmt.setString(3, user.getLocation());
            pstmt.setInt(4, user.getId());
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // user delete করো
    @Override
    public void delete(int id) {
        String sql = "DELETE FROM users WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // ResultSet থেকে User object তৈরি করা — helper method
    private User mapToUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getInt("id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("password"),
            rs.getString("mobile"),
            rs.getString("location")
        );
    }
}
```

**`mapToUser()` কী করে?**
Database থেকে `ResultSet` আসে — এটা একটা row-এর data। `mapToUser()` সেই raw data থেকে `User` object তৈরি করে।

```
ResultSet row: id=5, name="Rahim", email="rahim@test.com", ...
              ↓  mapToUser()
User object: User{id=5, name="Rahim", email="rahim@test.com", ...}
```

---

## 2. DonorRepository.java

```java
package com.bloodfinder.repository;

import com.bloodfinder.database.DatabaseManager;
import com.bloodfinder.model.Donor;
import com.bloodfinder.model.enums.BloodType;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class DonorRepository implements Repository<Donor> {

    private final Connection connection;

    public DonorRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    // নতুন donor insert করো
    @Override
    public void save(Donor donor) {
        String sql = "INSERT INTO donors (user_id, blood_type, last_donation_date, is_temp_unavailable) " +
                     "VALUES (?, ?, ?, ?)";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, donor.getId());            // user_id = User-এর id
            pstmt.setString(2, donor.getBloodType().name()); // Enum → String
            pstmt.setString(3, donor.getLastDonationDate()); // null হতে পারে
            pstmt.setInt(4, donor.isTempUnavailable() ? 1 : 0); // boolean → 0/1
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // user_id দিয়ে donor খোঁজো (কোনো user Donor কিনা check করতে)
    public Optional<Donor> findByUserId(int userId) {
        // JOIN query — donors ও users table একসাথে query
        String sql = "SELECT d.*, u.name, u.email, u.password, u.mobile, u.location " +
                     "FROM donors d " +
                     "JOIN users u ON d.user_id = u.id " +
                     "WHERE d.user_id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                return Optional.of(mapToDonor(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return Optional.empty();
    }

    // donors.id দিয়ে donor খোঁজো
    @Override
    public Optional<Donor> findById(int donorId) {
        String sql = "SELECT d.*, u.name, u.email, u.password, u.mobile, u.location " +
                     "FROM donors d " +
                     "JOIN users u ON d.user_id = u.id " +
                     "WHERE d.id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, donorId);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                return Optional.of(mapToDonor(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return Optional.empty();
    }

    // সব donors-এর list (JOIN সহ)
    @Override
    public List<Donor> findAll() {
        List<Donor> donors = new ArrayList<>();
        String sql = "SELECT d.*, u.name, u.email, u.password, u.mobile, u.location " +
                     "FROM donors d " +
                     "JOIN users u ON d.user_id = u.id";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                donors.add(mapToDonor(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return donors;
    }

    // donor update করো (blood type, last donation date, availability)
    @Override
    public void update(Donor donor) {
        String sql = "UPDATE donors SET blood_type=?, last_donation_date=?, " +
                     "is_temp_unavailable=? WHERE id=?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, donor.getBloodType().name());
            pstmt.setString(2, donor.getLastDonationDate());
            pstmt.setInt(3, donor.isTempUnavailable() ? 1 : 0);
            pstmt.setInt(4, donor.getDonorId());
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // donor delete করো (Donor status remove করার সময়)
    @Override
    public void delete(int donorId) {
        String sql = "DELETE FROM donors WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, donorId);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // ResultSet থেকে Donor object তৈরি
    private Donor mapToDonor(ResultSet rs) throws SQLException {
        return new Donor(
            rs.getInt("user_id"),             // User-এর id
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("password"),
            rs.getString("mobile"),
            rs.getString("location"),
            rs.getInt("id"),                  // donors.id → donorId
            BloodType.valueOf(rs.getString("blood_type")), // String → Enum
            rs.getString("last_donation_date"),
            rs.getInt("is_temp_unavailable") == 1 // 0/1 → boolean
        );
    }
}
```

**JOIN Query ব্যাখ্যা:**

```sql
SELECT d.*, u.name, u.email, u.password, u.mobile, u.location
FROM donors d
JOIN users u ON d.user_id = u.id
```

- `donors d` — donors table-কে `d` নামে alias করা
- `users u` — users table-কে `u` নামে alias করা
- `JOIN ... ON d.user_id = u.id` — donors.user_id এবং users.id যেখানে match করে, সেগুলো combine করো
- `d.*` — donors table-এর সব columns
- `u.name, u.email, ...` — users table-এর নির্দিষ্ট columns

**Result:**
```
d.id | d.user_id | d.blood_type | u.name  | u.email
-----+-----------+--------------+---------+-----------------
  1  |     1     | A_POS        | Rahim   | rahim@test.com
  2  |     3     | B_NEG        | Fatema  | fatema@test.com
```

---

## 3. RequestRepository.java

```java
package com.bloodfinder.repository;

import com.bloodfinder.database.DatabaseManager;
import com.bloodfinder.model.BloodRequest;
import com.bloodfinder.model.enums.RequestStatus;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class RequestRepository implements Repository<BloodRequest> {

    private final Connection connection;
    private final UserRepository userRepository;
    private final DonorRepository donorRepository;

    public RequestRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
        this.userRepository = new UserRepository();
        this.donorRepository = new DonorRepository();
    }

    // নতুন request save করো
    @Override
    public void save(BloodRequest request) {
        String sql = "INSERT INTO blood_requests " +
                     "(requester_id, donor_id, hospital, needed_date, reason, status, created_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, request.getRequester().getId());    // requester_id
            pstmt.setInt(2, request.getDonor().getDonorId());   // donor_id (donors.id!)
            pstmt.setString(3, request.getHospital());
            pstmt.setString(4, request.getNeededDate());
            pstmt.setString(5, request.getReason());
            pstmt.setString(6, request.getStatus().name());     // Enum → String
            pstmt.setString(7, request.getCreatedAt());
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // একটা specific donor-এর সব request দেখো
    public List<BloodRequest> findByDonorId(int donorId) {
        List<BloodRequest> requests = new ArrayList<>();
        String sql = "SELECT * FROM blood_requests WHERE donor_id = ? ORDER BY created_at DESC";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, donorId);
            ResultSet rs = pstmt.executeQuery();
            while (rs.next()) {
                BloodRequest req = mapToRequest(rs);
                if (req != null) requests.add(req);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return requests;
    }

    // Request-এর status update করো (PENDING → ACCEPTED বা CANCELLED)
    public void updateStatus(int requestId, RequestStatus status) {
        String sql = "UPDATE blood_requests SET status = ? WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, status.name());
            pstmt.setInt(2, requestId);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public Optional<BloodRequest> findById(int id) {
        String sql = "SELECT * FROM blood_requests WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                BloodRequest req = mapToRequest(rs);
                return Optional.ofNullable(req);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return Optional.empty();
    }

    @Override
    public List<BloodRequest> findAll() {
        List<BloodRequest> requests = new ArrayList<>();
        String sql = "SELECT * FROM blood_requests ORDER BY created_at DESC";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                BloodRequest req = mapToRequest(rs);
                if (req != null) requests.add(req);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return requests;
    }

    @Override
    public void update(BloodRequest request) {
        updateStatus(request.getId(), request.getStatus());
    }

    @Override
    public void delete(int id) {
        String sql = "DELETE FROM blood_requests WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // ResultSet থেকে BloodRequest object তৈরি
    private BloodRequest mapToRequest(ResultSet rs) throws SQLException {
        int requesterId = rs.getInt("requester_id");
        int donorId = rs.getInt("donor_id");

        // Requester (User) ও Donor load করো
        Optional<User> requester = userRepository.findById(requesterId);
        Optional<Donor> donor = donorRepository.findById(donorId);

        if (requester.isEmpty() || donor.isEmpty()) return null;

        return new BloodRequest(
            rs.getInt("id"),
            requester.get(),
            donor.get(),
            rs.getString("hospital"),
            rs.getString("needed_date"),
            rs.getString("reason"),
            RequestStatus.valueOf(rs.getString("status")), // String → Enum
            rs.getString("created_at")
        );
    }
}
```

---

## 4. DonationRecordRepository.java

```java
package com.bloodfinder.repository;

import com.bloodfinder.database.DatabaseManager;
import com.bloodfinder.model.DonationRecord;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class DonationRecordRepository implements Repository<DonationRecord> {

    private final Connection connection;

    public DonationRecordRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    // নতুন donation record save করো
    @Override
    public void save(DonationRecord record) {
        String sql = "INSERT INTO donation_records " +
                     "(donor_id, requester_name, hospital, donation_date) " +
                     "VALUES (?, ?, ?, ?)";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, record.getDonorId());
            pstmt.setString(2, record.getRequesterName());
            pstmt.setString(3, record.getHospital());
            pstmt.setString(4, record.getDonationDate());
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // একটা donor-এর সব donation records
    public List<DonationRecord> findByDonorId(int donorId) {
        List<DonationRecord> records = new ArrayList<>();
        String sql = "SELECT * FROM donation_records WHERE donor_id = ? " +
                     "ORDER BY donation_date DESC";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, donorId);
            ResultSet rs = pstmt.executeQuery();
            while (rs.next()) {
                records.add(mapToRecord(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return records;
    }

    @Override
    public Optional<DonationRecord> findById(int id) {
        String sql = "SELECT * FROM donation_records WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) return Optional.of(mapToRecord(rs));
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return Optional.empty();
    }

    @Override
    public List<DonationRecord> findAll() {
        List<DonationRecord> records = new ArrayList<>();
        String sql = "SELECT * FROM donation_records ORDER BY donation_date DESC";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) records.add(mapToRecord(rs));
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return records;
    }

    @Override
    public void update(DonationRecord record) { /* donation record update হয় না */ }

    @Override
    public void delete(int id) {
        String sql = "DELETE FROM donation_records WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private DonationRecord mapToRecord(ResultSet rs) throws SQLException {
        return new DonationRecord(
            rs.getInt("id"),
            rs.getInt("donor_id"),
            rs.getString("requester_name"),
            rs.getString("hospital"),
            rs.getString("donation_date")
        );
    }
}
```

---

## try-with-resources কী?

```java
try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
    // ...
}
// try block শেষ হলে pstmt automatically close হয়
```

`try (resource)` syntax — এই block শেষ হলে resource automatically close হয়। Database connection open রেখে না যাওয়া খুব important — resource leak হলে application slow হয়।

C++ এ RAII (Resource Acquisition Is Initialization) এর মতো কাজ করে।

---

## Repository Summary

| Repository | Extra Methods (interface-এর বাইরে) |
|-----------|-----------------------------------|
| `UserRepository` | `findByEmail(email)` |
| `DonorRepository` | `findByUserId(userId)` |
| `RequestRepository` | `findByDonorId(donorId)`, `updateStatus(id, status)` |
| `DonationRecordRepository` | `findByDonorId(donorId)` |
