# SCHOOL MANAGEMENT SYSTEM STRUCTURE

## Roles
- Admin
- Teacher
- Student

---

## Core Modules

### 1. Authentication
- Login / Logout
- Role-based access
- Session management

---

### 2. Users

#### Admin
- Full system control

#### Teacher
- Manage classes & grades

#### Student
- View data only

---

### 3. Students Module
- Personal Info
- Class Assignment
- Attendance
- Grades
- Reports (PDF export)

---

### 4. Teachers Module
- Profile
- Assigned Classes
- Subjects
- Schedule
- Reports (PDF)

---

### 5. Classes
- Class list
- Sections
- Student assignment

---

### 6. Subjects
- Subject list
- Teacher assignment

---

### 7. Timetable
- Class schedules
- Teacher schedules

---

### 8. Exams

Workflow:
1. Teacher enters grades
2. Admin reviews
3. Admin approves
4. Admin sets release date
5. Students view after release

---

### 9. Announcements
- Admin creates
- Visible to all users

---

### 10. Events
- School activities
- Calendar system

---

### 11. Messaging
- Admin ↔ Teacher
- Teacher ↔ Student

---

### 12. Dashboard System

Each role has:
- KPI Cards
- Activity Feed
- Role-specific actions

---

## Permissions

### Admin
- Full access

### Teacher
- Classes + Students + Grades

### Student
- Read-only personal data

---

## Data Flow

Teacher → submits grades  
Admin → approves & schedules  
Student → views after release  

---

## UI System Rules

- Same layout for all dashboards
- Same design system (colors, spacing, typography)
- Only content changes per role
- Sidebar consistent across roles
- Header consistent across roles