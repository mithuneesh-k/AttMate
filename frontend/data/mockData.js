export const ADMIN_STATS = [
    { label: 'Total classes', value: '12' },
    { label: 'Total faculty', value: '28' },
    { label: 'Total students', value: '63' },
];

export const CLASSES_DATA = [
    { id: '1', name: '25CS-A', advisorId: 'f4', students: 63, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '2', name: '25CS-B', advisorId: 'f5', students: 30, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '3', name: '25CS-C', advisorId: 'f6', students: 28, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '4', name: '25CS-D', advisorId: 'f7', students: 28, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '5', name: '25CS-E', advisorId: 'f8', students: 28, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '6', name: '25CS-F', advisorId: 'f9', students: 28, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '7', name: '25CS-G', advisorId: 'f10', students: 28, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '8', name: '25CS-H', advisorId: 'f11', students: 28, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
    { id: '9', name: '25CS-I', advisorId: 'f12', students: 28, subjects: 'English, Discrete Maths, Tamil Tech, Web Progr, Adv JAVA, DSA I, Engg Expl II, Design Thinking, Web Lab, Personality Dev, JAVA Lab, DSA Lab, Psychology', subjectsCount: 13 },
];

export const AVAILABLE_SUBJECTS = [
    'English for Career Growth',
    'Discrete Mathematics And Graph Theory',
    'Tamils and Technology',
    'Web Programming Concepts',
    'Advanced JAVA Programming',
    'Data Structures and Algorithms I',
    'Engineering Exploration II(EEPL)',
    'Design Thinking Engineering Laboratory',
    'Web Programming laboratory',
    'Personality Development',
    'Advanced JAVA Programming Lab',
    'Data Structures and Algorithms lab',
    'Psychology'
];

export const FACULTY_DATA = [
    { id: 'f1', name: 'Ms. Padmini', dept: 'CDC', subjects: 'English for Career Growth, Personality Development', email: 'padmini@attmate.com', assignedClass: null },
    { id: 'f2', name: 'Mrs. T. Saraswathi', dept: 'Maths', subjects: 'Discrete Mathematics And Graph Theory', email: 'saraswathi@attmate.com', assignedClass: null },
    { id: 'f3', name: 'Ms. Sangeetha V', dept: 'Tamil', subjects: 'Tamils and Technology', email: 'sangeetha@attmate.com', assignedClass: null },
    { id: 'f4', name: 'Mr. Sanjay Krishna', dept: 'CSE', subjects: 'Web Programming Concepts', email: 'sanjay@attmate.com', assignedClass: '25CS-A' },
    { id: 'f5', name: 'Mrs. Dhivya', dept: 'CSE', subjects: 'Advanced JAVA Programming', email: 'dhivya@attmate.com', assignedClass: '25CS-B' },
    { id: 'f6', name: 'Dr. Kannammal', dept: 'CSE', subjects: 'Data Structures and Algorithms I', email: 'kannammal@attmate.com', assignedClass: '25CS-C' },
    { id: 'f7', name: 'Mr. V. Balaji', dept: 'Mech', subjects: 'Engineering Exploration II(EEPL), Design Thinking Engineering Laboratory', email: 'balaji@attmate.com', assignedClass: null },
    { id: 'f8', name: 'Dr. Manokaran', dept: 'ECE', subjects: 'Engineering Exploration II(EEPL), Design Thinking Engineering Laboratory', email: 'manokaran@attmate.com', assignedClass: null },
    { id: 'f9', name: 'Mrs. Sharmila', dept: 'CSE', subjects: 'Web Programming laboratory', email: 'sharmila@attmate.com', assignedClass: null },
    { id: 'f10', name: 'Ms. Kalaiyarasi', dept: 'CSE', subjects: 'Advanced JAVA Programming Lab', email: 'kalaiyarasi@attmate.com', assignedClass: null },
    { id: 'f11', name: 'Mrs. Manimegalai', dept: 'CSE', subjects: 'Data Structures and Algorithms lab', email: 'manimegalai@attmate.com', assignedClass: null },
    { id: 'f12', name: 'Ms. Snega', dept: 'Psychology', subjects: 'Psychology', email: 'snega@attmate.com', assignedClass: null },
];

export const USER_CREDENTIALS = {
    'admin@attmate.com': { password: '123', role: 'admin', name: 'Admin User' },
    'padmini@attmate.com': { password: '123', role: 'teacher', facultyId: 'f1' },
    'saraswathi@attmate.com': { password: '123', role: 'teacher', facultyId: 'f2' },
    'sangeetha@attmate.com': { password: '123', role: 'teacher', facultyId: 'f3' },
    'sanjay@attmate.com': { password: '123', role: 'teacher', facultyId: 'f4' },
    'dhivya@attmate.com': { password: '123', role: 'teacher', facultyId: 'f5' },
    'kannammal@attmate.com': { password: '123', role: 'teacher', facultyId: 'f6' },
    'balaji@attmate.com': { password: '123', role: 'teacher', facultyId: 'f7' },
    'manokaran@attmate.com': { password: '123', role: 'teacher', facultyId: 'f8' },
    'sharmila@attmate.com': { password: '123', role: 'teacher', facultyId: 'f9' },
    'kalaiyarasi@attmate.com': { password: '123', role: 'teacher', facultyId: 'f10' },
    'manimegalai@attmate.com': { password: '123', role: 'teacher', facultyId: 'f11' },
    'snega@attmate.com': { password: '123', role: 'teacher', facultyId: 'f12' },
};

// This helper will be used by the App to load the "Current Teacher" data
export const getTeacherProfile = (facultyId) => {
    const faculty = FACULTY_DATA.find(f => f.id === facultyId);
    if (!faculty) return null;
    return {
        ...faculty,
        subjects: faculty.subjects.split(', '),
        avatarColor: '#16a34a'
    };
};

export const CHAT_MESSAGES = [
    { id: 1, text: 'Welcome! Type attendance like “25CS126, 25CS155 absent | 25CS144 OD”.', type: 'system' },
    { id: 2, text: 'Today: Period 2 session.', type: 'teacher' },
    { id: 3, text: 'Okay. Ready to record attendance.', type: 'system' },
];

export const OVERALL_ATTENDANCE = {
    percent: '88%',
    value: 88
};

export const SUBJECTS_STATS = [
    { name: 'Web Programming Concepts', days: 42, attendance: '91%', value: 91 },
    { name: 'Advanced JAVA Programming', days: 40, attendance: '88%', value: 88 },
    { name: 'Data Structures and Algorithms I', days: 39, attendance: '85%', value: 85 },
    { name: 'Discrete Mathematics And Graph Theory', days: 41, attendance: '82%', value: 82 },
    { name: 'English for Career Growth', days: 38, attendance: '94%', value: 94 },
    { name: 'Tamils and Technology', days: 20, attendance: '96%', value: 96 },
    { name: 'Engineering Exploration II(EEPL)', days: 15, attendance: '89%', value: 89 },
    { name: 'Design Thinking Engineering Laboratory', days: 12, attendance: '92%', value: 92 },
    { name: 'Web Programming laboratory', days: 14, attendance: '87%', value: 87 },
    { name: 'Personality Development', days: 10, attendance: '95%', value: 95 },
    { name: 'Advanced JAVA Programming Lab', days: 8, attendance: '93%', value: 93 },
    { name: 'Data Structures and Algorithms lab', days: 8, attendance: '91%', value: 91 },
    { name: 'Psychology', days: 12, attendance: '88%', value: 88 },
];

// Reference students list (Roll numbers for testing)
export const STUDENT_ATTENDANCE = [
    { roll: "25CS126", name: "LAVANYA.R", p: 36, a: 6, od: 0, percent: "86%" },
    { roll: "25CS127", name: "LITHIKA.D.B", p: 38, a: 4, od: 0, percent: "90%" },
    { roll: "25CS128", name: "LOGESH.R", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS129", name: "MAHALAKSHMI.B", p: 40, a: 2, od: 0, percent: "95%" },
    { roll: "25CS130", name: "MAHASAKTHI.S", p: 32, a: 10, od: 0, percent: "76%" },
    { roll: "25CS131", name: "MALINI.A", p: 37, a: 5, od: 0, percent: "88%" },
    { roll: "25CS132", name: "MANIKANDAN.N", p: 28, a: 14, od: 0, percent: "67%", low: true },
    { roll: "25CS133", name: "MANISH BHARATHI.G", p: 39, a: 3, od: 0, percent: "93%" },
    { roll: "25CS134", name: "MANISHA.S", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS135", name: "MANOJ KUMAR.S", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS136", name: "MATHAN KUMAR.K", p: 33, a: 9, od: 0, percent: "79%" },
    { roll: "25CS137", name: "MATHESH.K.S", p: 36, a: 6, od: 0, percent: "86%" },
    { roll: "25CS138", name: "MATHESH.U.B", p: 29, a: 13, od: 0, percent: "69%", low: true },
    { roll: "25CS139", name: "MAVYASHRI.M", p: 38, a: 4, od: 0, percent: "90%" },
    { roll: "25CS140", name: "MEENAKSHI.C", p: 37, a: 5, od: 0, percent: "88%" },
    { roll: "25CS141", name: "MEHAA.S", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS142", name: "MEKAJAYA.S", p: 40, a: 2, od: 0, percent: "95%" },
    { roll: "25CS143", name: "MITHRA.S", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS144", name: "MITHUNEESH.K", p: 38, a: 4, od: 0, percent: "90%" },
    { roll: "25CS145", name: "MOHAMED FAIZAL.S", p: 32, a: 10, od: 0, percent: "76%" },
    { roll: "25CS146", name: "MOHAMED IRFAN.N", p: 39, a: 3, od: 0, percent: "93%" },
    { roll: "25CS147", name: "MOHANA KRISHNAN.S", p: 27, a: 15, od: 0, percent: "64%", low: true },
    { roll: "25CS148", name: "MONISHA.M", p: 36, a: 6, od: 0, percent: "86%" },
    { roll: "25CS149", name: "MOUNIKA SHREE.M", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS150", name: "MUGESH KANNA.S", p: 38, a: 4, od: 0, percent: "90%" },
    { roll: "25CS151", name: "MUKESH.N.S", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS152", name: "MURUGAVEL.A", p: 40, a: 2, od: 0, percent: "95%" },
    { roll: "25CS153", name: "NAKSHATRA.S.V", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS154", name: "NANDHIKA VANJINAYAKI.B", p: 37, a: 5, od: 0, percent: "88%" },
    { roll: "25CS155", name: "NAREN.A", p: 26, a: 16, od: 0, percent: "62%", low: true },
    { roll: "25CS156", name: "NAREN.B", p: 39, a: 3, od: 0, percent: "93%" },
    { roll: "25CS157", name: "NARMATHA.R", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS158", name: "NAVEEN KUMAR.S.K", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS159", name: "NAVEEN.B", p: 33, a: 9, od: 0, percent: "79%" },
    { roll: "25CS160", name: "NAVEEN.K", p: 36, a: 6, od: 0, percent: "86%" },
    { roll: "25CS161", name: "NAVEEN.R", p: 38, a: 4, od: 0, percent: "90%" },
    { roll: "25CS162", name: "NAVIN.R", p: 37, a: 5, od: 0, percent: "88%" },
    { roll: "25CS163", name: "NETHRA.P", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS164", name: "NETHRA.S.P", p: 40, a: 2, od: 0, percent: "95%" },
    { roll: "25CS165", name: "NETHRA.S.S", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS166", name: "NETRA.V", p: 32, a: 10, od: 0, percent: "76%" },
    { roll: "25CS167", name: "NIKIL KARTHIK.S.A", p: 39, a: 3, od: 0, percent: "93%" },
    { roll: "25CS168", name: "NIRANJAN.B", p: 25, a: 17, od: 0, percent: "60%", low: true },
    { roll: "25CS169", name: "NISHAL.S", p: 36, a: 6, od: 0, percent: "86%" },
    { roll: "25CS170", name: "NISHANT.J.R", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS171", name: "NISHANT.J.S", p: 38, a: 4, od: 0, percent: "90%" },
    { roll: "25CS172", name: "NISHANTH.C", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS173", name: "NISHANTH.K.R", p: 40, a: 2, od: 0, percent: "95%" },
    { roll: "25CS174", name: "NISHANTH.R.K", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS175", name: "NISHANTH.S", p: 37, a: 5, od: 0, percent: "88%" },
    { roll: "25CS176", name: "NITHEESH.M", p: 31, a: 11, od: 0, percent: "74%", low: true },
    { roll: "25CS177", name: "NITHEESWAR.S", p: 39, a: 3, od: 0, percent: "93%" },
    { roll: "25CS178", name: "NITHICK.S.J", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS179", name: "NITHIN AKASH.P.S", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS180", name: "NITHIN.S.B", p: 33, a: 9, od: 0, percent: "79%" },
    { roll: "25CS181", name: "NITHISH NARAYANAN.C", p: 36, a: 6, od: 0, percent: "86%" },
    { roll: "25CS182", name: "NITHIYA SRI.K", p: 38, a: 4, od: 0, percent: "90%" },
    { roll: "25CS183", name: "NITISH.R.G", p: 37, a: 5, od: 0, percent: "88%" },
    { roll: "25CS184", name: "NIVEDITA.R", p: 34, a: 8, od: 0, percent: "81%" },
    { roll: "25CS185", name: "NIVETHA.K.T", p: 40, a: 2, od: 0, percent: "95%" },
    { roll: "25CS186", name: "NIVETHA.S", p: 35, a: 7, od: 0, percent: "83%" },
    { roll: "25CS187", name: "OVIYA RETHANYA.S", p: 32, a: 10, od: 0, percent: "76%" },
    { roll: "25CS188", name: "PADMANABHAN SURESH BABU", p: 39, a: 3, od: 0, percent: "93%" }
];
