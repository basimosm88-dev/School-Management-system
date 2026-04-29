import React, { useState } from 'react';
import ListModule from '../components/ui/ListModule';
import Modal from '../components/ui/Modal';
import DynamicForm from '../components/ui/DynamicForm';
import { useData } from '../contexts/DataContext';
import { useAppContext } from '../contexts/AppContext';

const moduleConfig = {
 'Students': {
 dataKey: 'students',
 addMethod: 'addStudent',
 deleteMethod: 'deleteStudent',
 fields: [
 { name: 'name', label: 'Full Name', placeholder: 'John Doe' },
 { name: 'email', label: 'Email', placeholder: 'john@school.com', type: 'email' },
 { name: 'classId', label: 'Class ID', placeholder: '1' }
 ]
 },
 'Teachers': {
 dataKey: 'teachers',
 addMethod: 'addTeacher',
 deleteMethod: 'deleteTeacher',
 fields: [
 { name: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
 { name: 'email', label: 'Email', placeholder: 'jane@school.com', type: 'email' },
 { name: 'subject', label: 'Subject', placeholder: 'Mathematics' }
 ]
 },
 'Classes': {
 dataKey: 'classes',
 addMethod: 'addClass',
 deleteMethod: 'deleteClass',
 fields: [
 { name: 'name', label: 'Class Name', placeholder: 'Grade 10-A' },
 { name: 'teacherId', label: 'Homeroom Teacher ID', placeholder: '1' }
 ]
 },
 'Subjects': {
 dataKey: 'subjects',
 addMethod: 'addSubject',
 deleteMethod: 'deleteSubject',
 fields: [
 { name: 'name', label: 'Subject Name', placeholder: 'Biology' },
 { name: 'code', label: 'Subject Code', placeholder: 'BIO101' }
 ]
 },
 'Messages': {
 dataKey: 'messages',
 addMethod: 'addMessage',
 deleteMethod: 'deleteMessage',
 fields: [
 { name: 'recipient', label: 'To (Recipient Name)', placeholder: 'Teacher or Student Name' },
 { name: 'subject', label: 'Subject', placeholder: 'Regarding...' },
 { name: 'content', label: 'Message Content', placeholder: 'Write your message here...', type: 'textarea' }
 ]
 },
 'Events': {
 dataKey: 'events',
 addMethod: 'addEvent',
 deleteMethod: 'deleteEvent',
 fields: [
 { name: 'title', label: 'Event Title', placeholder: 'Annual Sports Day' },
 { name: 'date', label: 'Date', type: 'date' },
 { name: 'description', label: 'Description', placeholder: 'Details about the event...', type: 'textarea' }
 ]
 },
 'Announcements': {
 dataKey: 'announcements',
 addMethod: 'addAnnouncement',
 deleteMethod: 'deleteAnnouncement',
 fields: [
 { name: 'title', label: 'Announcement Title', placeholder: 'Holiday Notice' },
 { name: 'date', label: 'Date', type: 'date' },
 { name: 'content', label: 'Content', placeholder: 'Announcement details...', type: 'textarea' }
 ]
 },
 'My Grades': {
 dataKey: 'grades',
 filterByKey: 'studentId'
 },
 'Attendance Record': {
 dataKey: 'attendance',
 filterByKey: 'studentId'
 }
};

const GenericModulePage = ({ role, title, primaryActionText }) => {
 const dataContext = useData();
 const { currentUser } = useAppContext();
 const [modalOpen, setModalOpen] = useState(false);
 const [formData, setFormData] = useState({});

 const config = moduleConfig[title];
 let items = config ? dataContext[config.dataKey] : [];

 // Filter for students
 if (role === 'student' && currentUser) {
 if (config?.filterByKey) {
 items = items.filter(item => item[config.filterByKey] === currentUser.id);
 } else if (title === 'My Profile') {
 items = dataContext.students.filter(s => s.id === currentUser.id);
 }
 }

 // Filter for teachers
 if (role === 'teacher' && currentUser) {
 const assignedClasses = currentUser.assignedClasses || [];
 if (title === 'Students') {
 items = items.filter(student => assignedClasses.includes(student.classId));
 } else if (title === 'My Classes' || title === 'Classes') {
 items = items.filter(cls => assignedClasses.includes(cls.id));
 } else if (title === 'Grades' || title === 'Exams') {
 items = items.filter(item => item.teacherId === currentUser.id);
 } else if (title === 'Subjects') {
 // Show subjects teacher is specialized in or assigned to
 const teacherSubjects = currentUser.subjects || [];
 items = items.filter(sub => teacherSubjects.includes(sub.name));
 }
 }

 const handleSave = () => {
 if (config && config.addMethod && Object.keys(formData).length > 0) {
 dataContext[config.addMethod](formData);
 setModalOpen(false);
 setFormData({});
 dataContext.addNotification(`New ${title.slice(0,-1)} added successfully!`, 'success');
 }
 };

 const handleDelete = (id) => {
 if (confirm("Are you sure you want to delete this record?")) {
 dataContext[config.deleteMethod](id);
 }
 };

 return (
 <>
 <ListModule 
 role={role} 
 title={title} 
 primaryActionText={primaryActionText}
 onPrimaryAction={primaryActionText ? () => setModalOpen(true) : null}
 >
 {items && items.length > 0 ? items.map((item) => (
 <tr key={item.id || item.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
 <td className="px-4 py-3 text-slate-900 dark:text-slate-100">#{item.id || 'N/A'}</td>
 <td className="px-4 py-3 text-slate-800 dark:text-slate-300">
 {item.name || item.subject || item.date}
 </td>
 <td className="px-4 py-3">
 <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-label  border ${
 item.status === 'PUBLISHED' || item.grade?.startsWith('A') 
 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200' 
 : 'bg-blue-50 dark:bg-blue-900/30 text-primary border-blue-200'
 }`}>
 {item.grade || item.status || (item.present ? `${item.present}% Present` : 'Active')}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 {role === 'admin' && config && config.deleteMethod && (
 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="p-1.5 text-slate-400/80 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
 <span className="material-symbols-outlined text-section">edit</span>
 </button>
 <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg">
 <span className="material-symbols-outlined text-section">delete</span>
 </button>
 </div>
 )}
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan="4" className="px-4 py-10 text-center text-slate-500/80 italic">
 No records found.
 </td>
 </tr>
 )}
 </ListModule>

 {config && config.fields && (
 <Modal
 isOpen={modalOpen}
 onClose={() => setModalOpen(false)}
 title={`Add New ${title.slice(0, -1)}`}
 onSave={handleSave}
 >
 <DynamicForm 
 fields={config.fields} 
 onChange={setFormData}
 initialData={formData}
 />
 </Modal>
 )}
 </>
 );
};

export default GenericModulePage;

