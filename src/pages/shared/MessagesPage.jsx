import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';

const MessagesPage = ({ role }) => {
  const { messages, sendMessage, teachers, students, currentUser: contextUser } = useData();
  const { currentUser } = useAppContext();
  const { permissions } = useSettings();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // Use currentUser from AppContext as it's the primary source of auth state
  const activeUser = currentUser;

  // Filter possible contacts based on role rules
  const getContacts = () => {
    if (role === 'admin') {
      return [...teachers.map(t => ({...t, role: 'teacher'})), ...students.map(s => ({...s, role: 'student'}))];
    }
    if (role === 'teacher') {
      // Message admin or students in their classes
      const myStudents = students.filter(s => activeUser.assignedClasses?.includes(s.classId));
      return [{ id: 1, name: 'School Administration', role: 'admin' }, ...myStudents.map(s => ({...s, role: 'student'}))];
    }
    if (role === 'student') {
      // Message teachers only
      return teachers.map(t => ({...t, role: 'teacher'}));
    }
    return [];
  };

  const contacts = getContacts();

  const filteredMessages = messages.filter(m => 
    ((m.sender_id === activeUser?.id && m.sender_role === role) && (m.receiver_id === selectedChat?.id && m.receiver_role === selectedChat?.role)) ||
    ((m.sender_id === selectedChat?.id && m.sender_role === selectedChat?.role) && (m.receiver_id === activeUser?.id && m.receiver_role === role))
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;
    
    const roleKey = role === 'admin' ? 'teachers' : role === 'teacher' ? 'teachers' : 'students';
    if (role !== 'admin' && !permissions[roleKey].sendMessage) {
      alert("Messaging is currently disabled by the administrator.");
      return;
    }

    sendMessage({
      sender_id: activeUser.id,
      sender_role: role,
      receiver_id: selectedChat.id,
      receiver_role: selectedChat.role,
      message_text: messageText,
    });
    setMessageText('');
  };

  return (
    <PageLayout role={role} title="Messages & Chat">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex h-[calc(100vh-220px)]">
        
        {/* Sidebar: Contacts */}
        <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search contacts..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
              <button 
                key={`${contact.role}-${contact.id}`}
                onClick={() => setSelectedChat(contact)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-b border-slate-50 dark:border-slate-800/50 ${selectedChat?.id === contact.id ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-primary' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold shrink-0">
                  {contact.name.charAt(0)}
                </div>
                <div className="text-left overflow-hidden">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{contact.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{contact.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {selectedChat.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedChat.name}</h3>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Online
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-2 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {filteredMessages.map(msg => {
                  const isMe = msg.sender_id === activeUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                        isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                      }`}>
                        <p className="leading-relaxed">{msg.message_text}</p>
                        <p className={`text-[10px] mt-2 font-medium ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    (role !== 'admin' && !permissions[role === 'teacher' ? 'teachers' : 'students'].sendMessage)
                    ? "Messaging is disabled..." 
                    : "Type a message..."
                  }
                  disabled={role !== 'admin' && !permissions[role === 'teacher' ? 'teachers' : 'students'].sendMessage}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!messageText.trim() || (role !== 'admin' && !permissions[role === 'teacher' ? 'teachers' : 'students'].sendMessage)}
                  className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">chat_bubble</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Start a Conversation</h3>
                <p className="text-xs max-w-[240px] mx-auto mt-1">Select a contact from the sidebar to begin messaging with teachers or administration.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default MessagesPage;
