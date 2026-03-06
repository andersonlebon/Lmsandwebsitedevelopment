Design a modern web platform for a vocational training institution called **Brotherly Training Center (BTC)**.

The platform should manage the **full student journey from registration to training, payment, and certification**.

The system should combine:

* School management system
* Learning management system (LMS)
* Payment management
* Student portal
* Admin dashboard

Design a clean modern interface similar to **Stripe dashboard + Notion + Coursera**.

Use **soft shadows, rounded components, glassmorphism cards, and minimal layout**.

Include **light mode and dark mode**.

---

# Main Modules

### Student Registration System

Design a **single unified registration form**.

Sections:

Personal Information

* Full Name
* Phone Number
* Gender
* Address
* Date of Birth

Referral Information

* Who informed the student about BTC

Training Selection
Dynamic fields based on department.

Departments:

* English
* Computer Science
* Driving
* Sewing

Course selection examples:

English

* Level 1
* Level 2
* TOT

Computer Science

* Word
* Excel
* PowerPoint
* Internet
* Full computer package

Driving

* Theory
* Practice
* Full driving program

Sewing

* Beginner
* Intermediate
* Advanced

---

### Class Schedule Selection

Students choose available time slots:

6:00 – 7:30
8:00 – 9:30
10:00 – 11:30
4:00 – 7:30

Design a **visual schedule picker**.

---

### Payment System

Design a payment interface that supports:

Monthly payments
Program payments
Payment history
Receipts

Example tariffs:

English → monthly payment
Computer → monthly payment
Driving → full program payment
Sewing → $25 per month for 6 months

---

### Boarding Pass System

When payment is confirmed, the system generates:

Student ID card
QR code
Class schedule
Department
Instructor

Design a **digital student card UI**.

---

### Attendance System

Design a system where instructors:

Scan student QR code
Mark attendance
See class list

---

### Student Dashboard

Students can see:

My courses
My schedule
Payment status
Attendance history
Certificates

Include learning progress bars.

---

### Instructor Dashboard

Instructor features:

View assigned classes
Mark attendance
View students
Upload materials
View schedule

---

### Admin Dashboard

Admin can manage:

Students
Courses
Departments
Instructors
Payments
Reports
Certificates

Include **analytics dashboard** with statistics:

Total students
Active students
Revenue
Departments performance

---

### Certificate System

Design digital certificates with:

Student name
Course
Completion date
QR verification code

---

# Design System

Include:

Typography scale
Color palette
Buttons
Inputs
Tables
Cards
Modals
Charts

Use modern SaaS style similar to:

Stripe
Linear
Notion
Coursera

---

# Tech mindset for developers

Design components compatible with:

React / Vite
Supabase
PostgreSQL
Drizzle ORM
Tailwind CSS
Shadcn UI
SWR

---

# Deliverables

Landing page
Student registration system
Student dashboard
Instructor dashboard
Admin dashboard
Certificate system
Payment interface
Mobile responsive layouts

Make the platform look like a **modern global EdTech platform**.
