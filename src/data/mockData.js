export const initialData = {
  students: [
    { 
      id: 1, 
      name: "Ahmed Hassan Omar", 
      gender: "Male", 
      birthDate: "2010-05-15",
      birthPlace: "Cairo, Egypt",
      phone: "+20 123 456 789",
      motherName: "Fatima Ali",
      parentStatus: "Both",
      address: {
        country: "Egypt",
        state: "Cairo",
        city: "Maadi",
        neighborhood: "Block 5",
        fullAddress: "Street 9, Building 45, Floor 2"
      },
      classId: 1,
      registrationDate: "2024-09-01",
      specialConditions: { disability: false, refugee: false },
      responsiblePerson: { name: "Hassan Omar", phone1: "+20 111 222 333", phone2: "" },
      registrationType: "By Exam",
      status: "Active",
      notes: "Excellent student, strong in mathematics."
    },
    { 
      id: 2, 
      name: "Sarah Jane Smith", 
      gender: "Female", 
      birthDate: "2011-03-20",
      birthPlace: "London, UK",
      phone: "+44 7700 900077",
      motherName: "Mary Smith",
      parentStatus: "No Father",
      address: {
        country: "Egypt",
        state: "Giza",
        city: "6th October",
        neighborhood: "District 1",
        fullAddress: "Villa 12, Area 3"
      },
      classId: 1,
      registrationDate: "2025-01-10",
      specialConditions: { disability: false, refugee: true },
      responsiblePerson: { name: "Mary Smith", phone1: "+44 123 456 789", phone2: "+20 555 666" },
      registrationType: "Transfer from another school",
      previousSchool: "London Academy",
      status: "Active",
      notes: "Transferred mid-term, adapting well."
    }
  ],
  teachers: [
    { 
      id: 1, 
      name: "Mark Stevens", 
      maritalStatus: "Married",
      address: "123 Education Ave, Cairo",
      email: "mark@school.com", 
      phone: "+20 100 200 3000",
      password: "123456",
      specialty: "Pure Mathematics",
      subjects: ["Mathematics", "Further Math"],
      assignedClasses: [1, 2],
      startedDate: "2020-01-01",
      joinedDate: "2020-01-15",
      educationLevel: "University",
      lastCertificate: "Master",
      extraCertificates: "Advanced Pedagogy",
      trainedAsTeacher: true,
      whereTrained: "Cairo University Education Dept",
      languages: { somali: false, english: true, arabic: true, other: "" },
      relatedPerson: { name: "Jane Stevens", relation: "Wife", address: "Same as above", phone: "+20 100 200 3001", email: "jane@gmail.com" },
      registrationType: "Exam",
      status: "Active",
      notes: "Senior math teacher with excellent record.",
      joinedAt: new Date().toISOString() 
    },
    { 
      id: 2, 
      name: "Sarah Connor", 
      maritalStatus: "Single",
      address: "45 Science St, Giza",
      email: "sarah@school.com", 
      phone: "+20 100 200 4000",
      password: "123456",
      specialty: "Theoretical Physics",
      subjects: ["Physics"],
      assignedClasses: [2],
      startedDate: "2022-09-01",
      joinedDate: "2022-09-10",
      educationLevel: "University",
      lastCertificate: "Bachelor",
      extraCertificates: "Lab Safety Cert",
      trainedAsTeacher: true,
      whereTrained: "Global Teachers Institute",
      languages: { somali: true, english: true, arabic: false, other: "" },
      relatedPerson: { name: "John Connor", relation: "Brother", address: "Giza, Egypt", phone: "+20 100 200 4001", email: "" },
      registrationType: "Other",
      status: "Active",
      notes: "Passionate about lab experiments.",
      joinedAt: new Date().toISOString() 
    }
  ],
  classes: [
    { 
      id: 1, 
      name: "Grade 10 - A", 
      gradeName: "Grade 10", 
      section: "A", 
      level: "Secondary", 
      capacity: 35, 
      studentsCount: 2, 
      teacherId: 1, 
      academicYear: "2025-2026", 
      status: "Active",
      subjects: [
        { name: "Mathematics", teacherId: 1 }
      ]
    },
    { 
      id: 2, 
      name: "Grade 11 - B", 
      gradeName: "Grade 11", 
      section: "B", 
      level: "Secondary", 
      capacity: 30, 
      studentsCount: 0, 
      teacherId: 2, 
      academicYear: "2025-2026", 
      status: "Active",
      subjects: [
        { name: "Physics", teacherId: 2 }
      ]
    }
  ],
  subjects: [
    { id: 1, name: "Mathematics", code: "MAT101", levels: ["Primary", "Middle", "Secondary"], weeklyPeriods: 6, status: "Active" },
    { id: 2, name: "Physics", code: "PHY101", levels: ["Secondary"], weeklyPeriods: 4, status: "Active" },
    { id: 3, name: "English", code: "ENG101", levels: ["Primary", "Middle", "Secondary"], weeklyPeriods: 5, status: "Active" }
  ],
  attendance: [
    { studentId: 1, present: 95, absent: 5, lastUpdated: "2026-04-25" },
    { studentId: 2, present: 88, absent: 12, lastUpdated: "2026-04-25" },
    { date: "2026-04-19", present: 95, absent: 5 },
    { date: "2026-04-20", present: 92, absent: 8 },
    { date: "2026-04-21", present: 98, absent: 2 },
    { date: "2026-04-22", present: 94, absent: 6 },
    { date: "2026-04-23", present: 91, absent: 9 },
    { date: "2026-04-24", present: 96, absent: 4 },
    { date: "2026-04-25", present: 97, absent: 3 }
  ],
  events: [
    { 
      id: 1, 
      title: "Annual Science Fair", 
      date: "2026-05-15", 
      start_time: "09:00",
      end_time: "15:00",
      location: "Main Hall",
      audience: "all",
      description: "Students showcase their innovative projects in the main hall.",
      createdBy: "admin"
    },
    { 
      id: 2, 
      title: "Mathematics Workshop", 
      date: "2026-05-20", 
      start_time: "10:30",
      end_time: "12:30",
      location: "Room 101",
      audience: "teachers",
      description: "Advanced teaching techniques for modern mathematics.",
      createdBy: "admin"
    },
    { 
      id: 3, 
      title: "Grade 10 Class Meeting", 
      date: "2026-05-10", 
      start_time: "14:00",
      end_time: "15:00",
      location: "Classroom 10A",
      audience: "class_1",
      description: "Meeting to discuss upcoming exams and project deadlines.",
      createdBy: "teacher_1"
    }
  ],
  announcements: [
    { 
      id: 1, 
      title: "Final Exam Schedule Released", 
      content: "Please check the timetable module for the detailed exam schedule. All students must be present 15 minutes before the start.", 
      date: "2026-04-24",
      audience: "all",
      priority: "urgent",
      attachment: null,
      createdBy: "admin"
    },
    { 
      id: 2, 
      title: "New Lab Equipment Arrived", 
      content: "The science lab has been upgraded with new microscopes and kits. Teachers can schedule lab sessions from next week.", 
      date: "2026-04-22",
      audience: "teachers",
      priority: "normal",
      attachment: null,
      createdBy: "admin"
    },
    { 
      id: 3, 
      title: "Physics Project Deadline", 
      content: "The deadline for the Physics project has been extended to Friday. Please submit your work through the portal.", 
      date: "2026-04-25",
      audience: "class_1",
      priority: "important",
      attachment: "physics_rubric.pdf",
      createdBy: "teacher_2"
    }
  ],
  messages: [
    { 
      id: 1, 
      sender_id: 1, 
      sender_role: 'admin',
      receiver_id: 1, 
      receiver_role: 'teacher',
      message_text: "Hello Mark, please review the new math syllabus.", 
      timestamp: "2026-04-25T10:00:00Z", 
      seen_status: true 
    },
    { 
      id: 2, 
      sender_id: 1, 
      sender_role: 'teacher',
      receiver_id: 1, 
      receiver_role: 'admin',
      message_text: "Sure thing. I will take a look this afternoon.", 
      timestamp: "2026-04-25T10:30:00Z", 
      seen_status: true 
    }
  ],
  systemLogs: [
    { id: 1, message: "New student Alice Smith added", date: "2026-04-25T10:00:00Z" },
    { id: 2, message: "Teacher Mark Stevens assigned to Class 10A", date: "2026-04-25T11:30:00Z" },
    { id: 3, message: "Grades submitted for Mathematics", date: "2026-04-25T14:15:00Z" }
  ],
  grades: [
    { id: 1, studentId: 1, subject: "Mathematics", type: "Midterm", grade: "A", status: "PUBLISHED", releaseDate: new Date().toISOString(), teacherId: 1 },
    { id: 2, studentId: 2, subject: "Mathematics", type: "Midterm", grade: "B+", status: "APPROVED", releaseDate: new Date(Date.now() + 86400000).toISOString(), teacherId: 1 },
    { id: 3, studentId: 3, subject: "Physics", type: "Quiz 1", grade: "A-", status: "SUBMITTED", releaseDate: null, teacherId: 2 }
  ],
  notifications: [
    { 
      id: 1, 
      title: "Welcome!", 
      message: "Welcome to the new School Management System!", 
      type: "info", 
      timestamp: new Date().toISOString(), 
      read: false,
      recipientId: "all" 
    },
    { 
      id: 2, 
      title: "Grade Released", 
      message: "Your Mathematics Midterm grade has been released.", 
      type: "success", 
      timestamp: new Date().toISOString(), 
      read: false,
      recipientId: 1 // Student 1
    }
  ]
};
