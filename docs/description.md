# Blood Finder — Feature Description

---

## প্রজেক্ট সম্পর্কে

**Blood Finder** একটি Java-based Blood Donor Management System।
যেকেউ register করতে পারবে, প্রয়োজনে Donor হতে পারবে, এবং যেকেউ donor খুঁজে সরাসরি blood request পাঠাতে পারবে।

---

## ব্যবহারকারীর ধরন

| Role | কী করতে পারবে |
|------|---------------|
| **Guest** | Register ছাড়াই Donor list দেখতে ও search করতে পারবে |
| **User** | Register করে login করবে, Donor দের কাছে blood request পাঠাতে পারবে |
| **Donor** | User থেকে convert হয়ে Donor হবে, blood request receive ও accept/cancel করতে পারবে |

> **নোট:** একজন Donor নিজেও অন্যের কাছে blood request পাঠাতে পারবে।

---

## Features

### ১. Registration ও Profile
- যেকেউ **Name, Mobile, Email, Password, Location** দিয়ে Register করতে পারবে
- Register করলে প্রথমে সে **User** হিসেবে থাকবে
- **Login / Logout** করা যাবে
- নিজের **Profile Edit** করা যাবে — Location, Mobile আপডেট করা যাবে

### ২. Donor হওয়া
- যেকোনো User চাইলে **"Become a Donor"** option থেকে —
  **Blood Type** ও **Last Donation Date** দিয়ে Donor হতে পারবে
- Donor চাইলে যেকোনো সময় **Donor status সরিয়ে** শুধু User হিসেবে থাকতে পারবে
- একটাই Account — শুধু role বদলায়

### ৩. Donor Availability (Automatic)
- Last Donation Date থেকে **৩ মাস পার হলে → Available**
- ৩ মাস না হলে → **Unavailable** (কতদিন বাকি সেটাও দেখাবে)
- Donor চাইলে manually **"Temporarily Unavailable"** করে রাখতে পারবে

### ৪. Donor Search ও Filter
> Login ছাড়াই যেকেউ search করতে পারবে

| Filter | কীভাবে কাজ করবে |
|--------|-----------------|
| **Blood Type** | A+, B-, O+ ইত্যাদি দিয়ে filter |
| **Location** | শহর বা এলাকা দিয়ে filter |
| **Hospital** | Hospital এর নাম দিলে সেই এলাকার donor দেখাবে |
| **Availability** | শুধু Available donor দেখাবে |

> Filter গুলো **একসাথে** ব্যবহার করা যাবে।

### ৫. Donor Profile
> Login ছাড়াই যেকেউ দেখতে পারবে

- নাম, Blood Type, Location, Availability status
- **Donation History** — কতবার donation করেছে, কোন তারিখে

### ৬. Blood Request System
> Login করতে হবে

**Request পাঠানো:**
- Logged-in User, Donor এর profile থেকে **"Request Blood"** করতে পারবে
- Request এ লিখবে — কোন Hospital, কখন দরকার, সংক্ষিপ্ত কারণ

**Donor এর কাছে Notification:**
- Request আসলে Donor এর notification panel এ দেখাবে
- Donor **Accept** বা **Cancel** করতে পারবে
- Cancel করলে কারণ লেখার option থাকবে (optional)

**Request Status:**
- User দেখতে পারবে — **Pending / Accepted / Cancelled**

### ৭. Donation History (Automatic)
- Donor কোনো request **Accept** করলে → **Donation History** তে automatically যোগ হবে
- History তে দেখাবে — তারিখ, Requester এর নাম, Hospital

---

## এখন যা থাকবে না
- Admin Panel
- Real SMS/Email Notification
- Map Integration
- Payment বা কোনো Transaction

---

## Application Flow

```
Register → User হয়
    ↓
চাইলে "Become a Donor" → Blood Type দিয়ে Donor হয়
    ↓
৩ মাস পর → Available দেখায়
    ↓
Guest/User → Search করে → Donor এর profile দেখে
    ↓
User → "Request Blood" পাঠায়
    ↓
Donor → Notification দেখে → Accept / Cancel করে
    ↓
Status update হয় → Donation History তে যোগ হয়
```
