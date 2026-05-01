const fs = require('fs');
const path = 'src/pages/shared/EventsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update card border
content = content.replace(
  'border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24',
  'border border-slate-200/80 dark:border-slate-800 shadow-sm sticky top-24'
);

// 2. Replace header section - remove calendar icon, update h3 style, update badge
content = content.replace(
  `<h3 className="text-label text-slate-900 dark:text-white flex items-center gap-2">\r\n  <span className="material-symbols-outlined text-primary">calendar_month</span>\r\n  Monthly Overview\r\n  </h3>\r\n  <span className="text-label bg-blue-50 dark:bg-blue-900/30 text-primary px-2 py-1 rounded">{monthName} {currentYear}</span>`,
  `<h3 className="text-headline text-slate-900 dark:text-white">Monthly Overview</h3>\r\n  <div className="bg-primary/5 dark:bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-label font-bold border border-primary/10">{monthName} {currentYear}</div>`
);

// 3. Update day label style
content = content.replace(
  `<span key={d} className="text-label text-slate-400/80 dark:text-slate-500/80">{d}</span>`,
  `<span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</span>`
);

// 4. Replace day cell rendering - old style with ring, new style with dot
const oldCell = `  <div key={i} className={\`aspect-square flex items-center justify-center rounded-xl text-label  cursor-pointer transition-all\r\n  \${isToday ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400/80 hover:bg-slate-50 dark:hover:bg-slate-800'}\r\n  \${hasEvent && !isToday ? 'ring-2 ring-primary/20 ring-offset-1 dark:ring-offset-slate-900' : ''}\r\n  \`}>\r\n  {day}\r\n  </div>`;

const newCell = `  <div key={i} className={\`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-all relative\r\n  \${isToday ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 z-10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}\r\n  \`}>\r\n  {day}\r\n  {hasEvent && (\r\n  <span className={\`absolute bottom-1 w-1 h-1 rounded-full \${isToday ? 'bg-white' : 'bg-primary'}\`}></span>\r\n  )}\r\n  </div>`;

content = content.replace(oldCell, newCell);

// 5. Replace legend section margin/border
content = content.replace(
  '<div className="mt-8 space-y-4">',
  '<div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done. Replacements applied.');
