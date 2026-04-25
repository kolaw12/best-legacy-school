// Best Legacy Divine School — canonical academic structure.
// Only these class levels exist. Do not add secondary levels.

export const NURSERY_LEVELS = ['Nursery 1', 'Nursery 2'];
export const BASIC_LEVELS = ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'];
export const CLASS_LEVELS = [...NURSERY_LEVELS, ...BASIC_LEVELS];

export const isNursery = (level) => NURSERY_LEVELS.includes(level);
export const isBasic = (level) => BASIC_LEVELS.includes(level);

// Promotion flow map (source → target). Basic 6 is the terminal level.
export const PROMOTION_MAP = {
    'Nursery 1': 'Nursery 2',
    'Nursery 2': 'Basic 1',
    'Basic 1': 'Basic 2',
    'Basic 2': 'Basic 3',
    'Basic 3': 'Basic 4',
    'Basic 4': 'Basic 5',
    'Basic 5': 'Basic 6',
    'Basic 6': null,
};

export const NURSERY_SUBJECTS = [
    'English / Literacy', 'Phonics', 'Numeracy', 'Basic Science',
    'Social Habits', 'Creative Arts', 'Rhymes & Songs', 'Reading',
    'Handwriting Readiness', 'Bible Knowledge', 'Physical Development',
];

export const BASIC_SUBJECTS = [
    'English Language', 'Mathematics', 'Basic Science & Technology',
    'Social Studies', 'Civic Education', 'Christian Religious Studies',
    'Computer Studies / ICT', 'Yoruba', 'Physical & Health Education',
    'Creative Arts', 'Agricultural Science', 'Handwriting',
    'Verbal Reasoning', 'Quantitative Reasoning',
];

export const NURSERY_RATING_SCALE = [
    { code: 'E',  label: 'Excellent',          range: [85, 100] },
    { code: 'VG', label: 'Very Good',          range: [70, 84] },
    { code: 'G',  label: 'Good',               range: [55, 69] },
    { code: 'F',  label: 'Fair',               range: [40, 54] },
    { code: 'NI', label: 'Needs Improvement',  range: [0, 39] },
];

export const BASIC_GRADE_SCALE = [
    { grade: 'A', remark: 'Excellent',  min: 75 },
    { grade: 'B', remark: 'Very Good',  min: 65 },
    { grade: 'C', remark: 'Good',       min: 50 },
    { grade: 'D', remark: 'Fair',       min: 40 },
    { grade: 'E', remark: 'Pass',       min: 30 },
    { grade: 'F', remark: 'Fail',       min: 0 },
];

export const ACADEMIC_TERMS = ['First Term', 'Second Term', 'Third Term'];

export const currentSession = () => {
    const now = new Date();
    const year = now.getFullYear();
    // Nigerian academic session starts in September.
    const startYear = now.getMonth() >= 8 ? year : year - 1;
    return `${startYear}/${startYear + 1}`;
};
