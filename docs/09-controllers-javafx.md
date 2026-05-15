# 09 — Controllers এবং JavaFX

---

## JavaFX কী?

**JavaFX** হলো Java-র একটা GUI (Graphical User Interface) framework — Desktop application-এর window, button, text field ইত্যাদি তৈরি করতে।

C++ এর Qt framework-এর মতো। Java-র পুরনো `Swing` library-র আধুনিক replacement।

### JavaFX-এর মূল অংশ:

| অংশ | কাজ | উদাহরণ |
|-----|-----|---------|
| `Stage` | Window | পুরো application window |
| `Scene` | Window-এর content | একটা screen-এর সব কিছু |
| `Node` | UI element | Button, Label, TextField |
| `FXML` | UI design file | XML-based layout |
| `Controller` | FXML-এর logic | Button click handle |

---

## FXML কী?

**FXML** হলো XML-based file format যেটা দিয়ে JavaFX-এর UI design করা হয়।

HTML যেমন webpage-এর structure define করে, FXML তেমন JavaFX screen-এর structure define করে।

```xml
<!-- login.fxml -->
<?xml version="1.0" encoding="UTF-8"?>

<?import javafx.scene.layout.VBox?>
<?import javafx.scene.control.TextField?>
<?import javafx.scene.control.PasswordField?>
<?import javafx.scene.control.Button?>
<?import javafx.scene.control.Label?>

<!-- fx:controller — এই FXML-এর Controller class কোনটা -->
<VBox xmlns:fx="http://javafx.com/fxml"
      fx:controller="com.bloodfinder.controller.LoginController"
      spacing="15" alignment="CENTER">

    <Label text="Blood Finder" style="-fx-font-size: 24;" />

    <!-- fx:id — Controller-এ এই নামে @FXML inject হবে -->
    <TextField fx:id="emailField" promptText="Email" />
    <PasswordField fx:id="passwordField" promptText="Password" />

    <!-- onAction — button click হলে কোন method call হবে -->
    <Button text="Login" onAction="#handleLogin" />
    <Button text="Register" onAction="#handleRegister" />

    <!-- Error message দেখানোর Label -->
    <Label fx:id="errorLabel" style="-fx-text-fill: red;" />

</VBox>
```

**FXML-এর key attributes:**
- `fx:controller="..."` → কোন Controller class এই FXML handle করবে
- `fx:id="..."` → Controller-এ এই name দিয়ে inject হবে (`@FXML`)
- `onAction="#methodName"` → কোন method call হবে (# মানে method reference)

---

## Controller কী?

**Controller** হলো FXML-এর Java counterpart — UI-এর logic থাকে এখানে।

FXML define করে "Button আছে", Controller define করে "Button click করলে কী হবে"।

### @FXML Annotation কী?

```java
@FXML
private TextField emailField;
```

`@FXML` annotation দিলে JavaFX automatically FXML file-এর `fx:id="emailField"` element-কে এই field-এ inject করে দেয়।

মানে: FXML-এ `fx:id="emailField"` আর Java-তে `@FXML private TextField emailField` → এরা একই TextField।

### initialize() Method:

```java
@FXML
public void initialize() {
    // Screen load হওয়ার সাথে সাথে এই method call হয়
    // এখানে initial setup করা হয়
}
```

---

## App.navigateTo() — Screen Switch

```java
// App.java
public class App extends Application {

    private static Stage primaryStage;

    @Override
    public void start(Stage stage) {
        primaryStage = stage;
        navigateTo("login.fxml");
        stage.setTitle("Blood Finder");
        stage.show();
    }

    // যেকোনো Controller এটা call করে screen change করতে পারে
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
        launch(args);
    }
}
```

**কীভাবে কাজ করে:**
1. `App.navigateTo("dashboard.fxml")` call হয়
2. `dashboard.fxml` load হয়
3. `FXMLLoader` FXML parse করে, Controller তৈরি করে
4. Controller-এর `@FXML` fields inject হয়
5. `initialize()` call হয়
6. নতুন Scene set হয়, user দেখতে পায়

---

## 1. LoginController.java

```java
package com.bloodfinder.controller;

import com.bloodfinder.App;
import com.bloodfinder.service.AuthService;
import com.bloodfinder.util.AlertUtil;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;

public class LoginController {

    // FXML-এর elements inject হবে এখানে
    @FXML private TextField emailField;
    @FXML private PasswordField passwordField;
    @FXML private Label errorLabel;

    // Service
    private final AuthService authService = AuthService.getInstance();

    @FXML
    public void initialize() {
        errorLabel.setText("");  // শুরুতে error label খালি
    }

    // "Login" button click করলে এই method call হয়
    @FXML
    private void handleLogin() {
        String email = emailField.getText().trim();
        String password = passwordField.getText();

        try {
            authService.login(email, password);
            // Login সফল → Dashboard-এ যাও
            App.navigateTo("dashboard.fxml");
        } catch (IllegalArgumentException e) {
            // Login fail → error দেখাও
            errorLabel.setText(e.getMessage());
        }
    }

    // "Register" button click করলে
    @FXML
    private void handleRegister() {
        App.navigateTo("register.fxml");
    }
}
```

---

## 2. RegisterController.java

```java
package com.bloodfinder.controller;

import com.bloodfinder.App;
import com.bloodfinder.service.AuthService;
import com.bloodfinder.util.AlertUtil;
import javafx.fxml.FXML;
import javafx.scene.control.*;

public class RegisterController {

    @FXML private TextField nameField;
    @FXML private TextField emailField;
    @FXML private PasswordField passwordField;
    @FXML private PasswordField confirmPasswordField;
    @FXML private TextField mobileField;
    @FXML private TextField locationField;
    @FXML private Label errorLabel;

    private final AuthService authService = AuthService.getInstance();

    @FXML
    public void initialize() {
        errorLabel.setText("");
    }

    @FXML
    private void handleRegister() {
        String name     = nameField.getText().trim();
        String email    = emailField.getText().trim();
        String password = passwordField.getText();
        String confirm  = confirmPasswordField.getText();
        String mobile   = mobileField.getText().trim();
        String location = locationField.getText().trim();

        // Password ও Confirm Password match কিনা — Controller-এ check (UI concern)
        if (!password.equals(confirm)) {
            errorLabel.setText("Passwords do not match.");
            return;  // এখানেই থামো
        }

        try {
            authService.register(name, email, password, mobile, location);
            AlertUtil.showSuccess("Registration successful! Please login.");
            App.navigateTo("login.fxml");
        } catch (IllegalArgumentException e) {
            errorLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleBackToLogin() {
        App.navigateTo("login.fxml");
    }
}
```

---

## 3. DashboardController.java

```java
package com.bloodfinder.controller;

import com.bloodfinder.App;
import com.bloodfinder.model.Donor;
import com.bloodfinder.model.User;
import com.bloodfinder.service.AuthService;
import com.bloodfinder.service.DonorService;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;

import java.util.Optional;

public class DashboardController {

    @FXML private Label welcomeLabel;
    @FXML private Label donorStatusLabel;
    @FXML private Button becomeDonorButton;
    @FXML private Button myDonorProfileButton;

    private final AuthService authService = AuthService.getInstance();
    private final DonorService donorService = DonorService.getInstance();

    @FXML
    public void initialize() {
        User currentUser = authService.getCurrentUser();

        // Welcome message
        welcomeLabel.setText("Welcome, " + currentUser.getName() + "!");

        // Donor status check
        Optional<Donor> donorOpt = donorService.getDonorByUserId(currentUser.getId());

        if (donorOpt.isPresent()) {
            // Donor হলে
            Donor donor = donorOpt.get();
            donorStatusLabel.setText("Donor Status: " + donor.getAvailabilityStatus().getDisplayName());
            becomeDonorButton.setVisible(false);    // "Become Donor" button লুকাও
            myDonorProfileButton.setVisible(true);  // "My Donor Profile" দেখাও
        } else {
            // Donor না হলে
            donorStatusLabel.setText("You are not a donor yet.");
            becomeDonorButton.setVisible(true);
            myDonorProfileButton.setVisible(false);
        }
    }

    @FXML
    private void handleSearchDonors() {
        App.navigateTo("donor-search.fxml");
    }

    @FXML
    private void handleBecomeDonor() {
        App.navigateTo("become-donor.fxml");
    }

    @FXML
    private void handleMyDonorProfile() {
        App.navigateTo("donor-profile.fxml");
    }

    @FXML
    private void handleLogout() {
        authService.logout();
        App.navigateTo("login.fxml");
    }
}
```

**`initialize()` এ UI logic:**

Dashboard-এ Donor হলে আলাদা option, না হলে আলাদা option। এই conditional display login-এর পরপরই `initialize()` এ check করা হয়।

---

## 4. DonorSearchController.java

```java
package com.bloodfinder.controller;

import com.bloodfinder.App;
import com.bloodfinder.model.Donor;
import com.bloodfinder.model.enums.BloodType;
import com.bloodfinder.service.SearchService;
import com.bloodfinder.util.DataHolder;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;

import java.util.List;

public class DonorSearchController {

    @FXML private ComboBox<String> bloodTypeComboBox;
    @FXML private TextField locationField;
    @FXML private ListView<Donor> donorListView;
    @FXML private Label resultCountLabel;

    private final SearchService searchService = SearchService.getInstance();

    @FXML
    public void initialize() {
        // ComboBox-এ Blood Type options যোগ করো
        bloodTypeComboBox.getItems().add("All Blood Types");
        for (BloodType bt : BloodType.values()) {
            bloodTypeComboBox.getItems().add(bt.getDisplayName());
        }
        bloodTypeComboBox.setValue("All Blood Types");

        // ListView-এ Donor display format set করো
        donorListView.setCellFactory(lv -> new ListCell<Donor>() {
            @Override
            protected void updateItem(Donor donor, boolean empty) {
                super.updateItem(donor, empty);
                if (empty || donor == null) {
                    setText(null);
                } else {
                    setText(donor.getName() + " — " +
                            donor.getBloodType().getDisplayName() + " — " +
                            donor.getLocation());
                }
            }
        });

        // সব available donor দেখাও (initially)
        loadDonors(null, null);
    }

    @FXML
    private void handleSearch() {
        String selectedBT = bloodTypeComboBox.getValue();
        String location = locationField.getText().trim();

        // Selected blood type string → Enum (বা null যদি "All" select হয়)
        BloodType bloodType = null;
        if (!"All Blood Types".equals(selectedBT)) {
            // displayName থেকে Enum খোঁজো
            for (BloodType bt : BloodType.values()) {
                if (bt.getDisplayName().equals(selectedBT)) {
                    bloodType = bt;
                    break;
                }
            }
        }

        loadDonors(bloodType, location);
    }

    private void loadDonors(BloodType bloodType, String location) {
        List<Donor> results = searchService.searchDonors(bloodType, location);
        donorListView.setItems(FXCollections.observableArrayList(results));
        resultCountLabel.setText(results.size() + " donor(s) found");
    }

    // Donor select করে Profile দেখো
    @FXML
    private void handleViewProfile() {
        Donor selected = donorListView.getSelectionModel().getSelectedItem();
        if (selected == null) {
            return;  // কেউ select করা নেই
        }

        // DataHolder দিয়ে selected donor পরের screen-এ pass করো
        DataHolder.setSelectedDonor(selected);
        App.navigateTo("donor-profile.fxml");
    }

    @FXML
    private void handleBack() {
        App.navigateTo("dashboard.fxml");
    }
}
```

**`FXCollections.observableArrayList()`:**
JavaFX-এর ListView বা TableView normal Java List দিয়ে কাজ করে না — `ObservableList` দরকার। `FXCollections.observableArrayList(list)` দিয়ে convert করা হয়।

---

## 5. DonorProfileController.java

```java
package com.bloodfinder.controller;

import com.bloodfinder.App;
import com.bloodfinder.model.Donor;
import com.bloodfinder.model.User;
import com.bloodfinder.service.AuthService;
import com.bloodfinder.service.DonorService;
import com.bloodfinder.util.AlertUtil;
import com.bloodfinder.util.DataHolder;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;

import java.util.Optional;

public class DonorProfileController {

    @FXML private Label nameLabel;
    @FXML private Label bloodTypeLabel;
    @FXML private Label locationLabel;
    @FXML private Label mobileLabel;
    @FXML private Label availabilityLabel;
    @FXML private Label lastDonationLabel;
    @FXML private Button sendRequestButton;
    @FXML private Button toggleAvailabilityButton;
    @FXML private Button removeDonorStatusButton;

    private final AuthService authService = AuthService.getInstance();
    private final DonorService donorService = DonorService.getInstance();

    private Donor viewingDonor;  // যার profile দেখা হচ্ছে
    private boolean isOwnProfile;  // নিজের profile কিনা

    @FXML
    public void initialize() {
        User currentUser = authService.getCurrentUser();

        // DataHolder থেকে donor নেওয়া
        Donor donorFromHolder = DataHolder.getSelectedDonor();

        if (donorFromHolder != null) {
            // অন্য কারো profile দেখছে
            viewingDonor = donorFromHolder;
            isOwnProfile = false;
            DataHolder.clear();  // Use করা হয়ে গেছে, clear করো
        } else {
            // নিজের profile দেখছে (Dashboard থেকে "My Profile" click)
            Optional<Donor> ownDonor = donorService.getDonorByUserId(currentUser.getId());
            if (ownDonor.isEmpty()) {
                AlertUtil.showError("Donor profile not found.");
                App.navigateTo("dashboard.fxml");
                return;
            }
            viewingDonor = ownDonor.get();
            isOwnProfile = true;
        }

        // Profile info display করো
        nameLabel.setText(viewingDonor.getName());
        bloodTypeLabel.setText(viewingDonor.getBloodType().getDisplayName());
        locationLabel.setText(viewingDonor.getLocation());
        mobileLabel.setText(viewingDonor.getMobile());
        availabilityLabel.setText(viewingDonor.getAvailabilityStatus().getDisplayName());

        String lastDonation = viewingDonor.getLastDonationDate();
        lastDonationLabel.setText(lastDonation != null ? lastDonation : "No donation recorded");

        // Button visibility — নিজের profile হলে management options, অন্যের হলে Request button
        sendRequestButton.setVisible(!isOwnProfile);
        toggleAvailabilityButton.setVisible(isOwnProfile);
        removeDonorStatusButton.setVisible(isOwnProfile);
    }

    // অন্যের profile থেকে Request পাঠানো
    @FXML
    private void handleSendRequest() {
        DataHolder.setSelectedDonor(viewingDonor);
        App.navigateTo("request.fxml");
    }

    // নিজের availability toggle করা
    @FXML
    private void handleToggleAvailability() {
        donorService.toggleAvailability(viewingDonor);
        // Label update
        availabilityLabel.setText(viewingDonor.getAvailabilityStatus().getDisplayName());
        AlertUtil.showSuccess("Availability updated.");
    }

    // Donor status সম্পূর্ণ remove করা
    @FXML
    private void handleRemoveDonorStatus() {
        donorService.removeDonorStatus(viewingDonor);
        AlertUtil.showSuccess("Donor status removed.");
        App.navigateTo("dashboard.fxml");
    }

    @FXML
    private void handleBack() {
        if (isOwnProfile) {
            App.navigateTo("dashboard.fxml");
        } else {
            App.navigateTo("donor-search.fxml");
        }
    }
}
```

---

## 6. RequestController.java

```java
package com.bloodfinder.controller;

import com.bloodfinder.App;
import com.bloodfinder.model.BloodRequest;
import com.bloodfinder.model.Donor;
import com.bloodfinder.model.User;
import com.bloodfinder.model.enums.RequestStatus;
import com.bloodfinder.service.AuthService;
import com.bloodfinder.service.RequestService;
import com.bloodfinder.util.AlertUtil;
import com.bloodfinder.util.DataHolder;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;

import java.util.List;

public class RequestController {

    // Send Request form elements
    @FXML private VBox sendRequestForm;
    @FXML private Label donorNameLabel;
    @FXML private TextField hospitalField;
    @FXML private DatePicker neededDatePicker;
    @FXML private TextArea reasonArea;

    // Incoming requests (Donor view)
    @FXML private VBox incomingRequestsView;
    @FXML private ListView<BloodRequest> requestsListView;

    private final AuthService authService = AuthService.getInstance();
    private final RequestService requestService = RequestService.getInstance();

    private Donor targetDonor;  // কার কাছে Request পাঠাব

    @FXML
    public void initialize() {
        targetDonor = DataHolder.getSelectedDonor();

        if (targetDonor != null) {
            // Send Request mode — অন্য Donor-কে request পাঠাচ্ছি
            DataHolder.clear();
            sendRequestForm.setVisible(true);
            incomingRequestsView.setVisible(false);
            donorNameLabel.setText("Sending request to: " + targetDonor.getName());
        } else {
            // Incoming Requests mode — আমার কাছে আসা requests দেখছি
            sendRequestForm.setVisible(false);
            incomingRequestsView.setVisible(true);
            loadIncomingRequests();
        }
    }

    @FXML
    private void handleSendRequest() {
        User currentUser = authService.getCurrentUser();
        String hospital  = hospitalField.getText().trim();
        String neededDate = neededDatePicker.getValue() != null
                           ? neededDatePicker.getValue().toString()
                           : null;
        String reason = reasonArea.getText().trim();

        try {
            requestService.sendRequest(currentUser, targetDonor, hospital, neededDate, reason);
            AlertUtil.showSuccess("Blood request sent successfully!");
            App.navigateTo("dashboard.fxml");
        } catch (Exception e) {
            AlertUtil.showError(e.getMessage());
        }
    }

    private void loadIncomingRequests() {
        User currentUser = authService.getCurrentUser();
        // Current user-এর donorId লাগবে — DonorService থেকে
        // (simplified — assume DataHolder-এ already আছে অথবা AuthService থেকে নেওয়া হয়)
    }

    @FXML
    private void handleAcceptRequest() {
        BloodRequest selected = requestsListView.getSelectionModel().getSelectedItem();
        if (selected == null) return;

        try {
            requestService.acceptRequest(selected);
            AlertUtil.showSuccess("Request accepted! Donation record created.");
            App.navigateTo("dashboard.fxml");
        } catch (Exception e) {
            AlertUtil.showError(e.getMessage());
        }
    }

    @FXML
    private void handleCancelRequest() {
        BloodRequest selected = requestsListView.getSelectionModel().getSelectedItem();
        if (selected == null) return;

        try {
            requestService.cancelRequest(selected);
            AlertUtil.showSuccess("Request cancelled.");
            loadIncomingRequests();  // List refresh করো
        } catch (Exception e) {
            AlertUtil.showError(e.getMessage());
        }
    }

    @FXML
    private void handleBack() {
        App.navigateTo("dashboard.fxml");
    }
}
```

---

## 7. BecomeDonorController.java

```java
package com.bloodfinder.controller;

import com.bloodfinder.App;
import com.bloodfinder.model.User;
import com.bloodfinder.model.enums.BloodType;
import com.bloodfinder.service.AuthService;
import com.bloodfinder.service.DonorService;
import com.bloodfinder.util.AlertUtil;
import javafx.fxml.FXML;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;

public class BecomeDonorController {

    @FXML private ComboBox<String> bloodTypeComboBox;
    @FXML private Label errorLabel;

    private final AuthService authService = AuthService.getInstance();
    private final DonorService donorService = DonorService.getInstance();

    @FXML
    public void initialize() {
        // Blood Type options যোগ করো
        for (BloodType bt : BloodType.values()) {
            bloodTypeComboBox.getItems().add(bt.getDisplayName());
        }
        errorLabel.setText("");
    }

    @FXML
    private void handleBecomeDonor() {
        String selectedBT = bloodTypeComboBox.getValue();

        if (selectedBT == null) {
            errorLabel.setText("Please select your blood type.");
            return;
        }

        // DisplayName → BloodType Enum
        BloodType bloodType = null;
        for (BloodType bt : BloodType.values()) {
            if (bt.getDisplayName().equals(selectedBT)) {
                bloodType = bt;
                break;
            }
        }

        User currentUser = authService.getCurrentUser();

        try {
            donorService.becomeDonor(currentUser, bloodType);
            AlertUtil.showSuccess("You are now a donor!");
            App.navigateTo("dashboard.fxml");
        } catch (Exception e) {
            errorLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleBack() {
        App.navigateTo("dashboard.fxml");
    }
}
```

---

## DataHolder Pattern Summary

```
Screen A → DataHolder.set(data) → navigateTo("screen-b.fxml")
                                         ↓
                                   Screen B loads
                                         ↓
                                   initialize() runs
                                         ↓
                                   DataHolder.get(data) → use it
                                         ↓
                                   DataHolder.clear()
```

JavaFX-এ Controller-এর constructor-এ parameter pass করা যায় না। তাই `DataHolder` static class দিয়ে data pass করা হয়।

---

## Controller Summary Table

| Controller | FXML | কাজ |
|-----------|------|-----|
| `LoginController` | `login.fxml` | Email/password নিয়ে login |
| `RegisterController` | `register.fxml` | নতুন user তৈরি |
| `DashboardController` | `dashboard.fxml` | Main screen, user status দেখা |
| `DonorSearchController` | `donor-search.fxml` | Blood type ও location দিয়ে search |
| `DonorProfileController` | `donor-profile.fxml` | Donor detail, request পাঠানো বা নিজের profile manage |
| `RequestController` | `request.fxml` | Request পাঠানো / incoming requests দেখা |
| `BecomeDonorController` | `become-donor.fxml` | Blood type select করে Donor হওয়া |
