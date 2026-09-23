// Best Legacy Divine School — canonical academic structure.
// KG 1, KG 2, Nursery 1, Nursery 2, Primary 1..Primary 5.

export const KG_LEVELS = ['KG 1', 'KG 2'];
export const NURSERY_LEVELS = ['Nursery 1', 'Nursery 2'];
export const PRIMARY_LEVELS = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5'];
export const CLASS_LEVELS = [...KG_LEVELS, ...NURSERY_LEVELS, ...PRIMARY_LEVELS];

// Backwards compat aliases
export const BASIC_LEVELS = PRIMARY_LEVELS;

export const isKg = (level) => KG_LEVELS.includes(level);
export const isNursery = (level) => NURSERY_LEVELS.includes(level);
export const isBasic = (level) => PRIMARY_LEVELS.includes(level);
export const isPrimary = (level) => PRIMARY_LEVELS.includes(level);

// Promotion flow map (source → target). Primary 5 is the terminal level.
export const PROMOTION_MAP = {
    'KG 1': 'KG 2',
    'KG 2': 'Nursery 1',
    'Nursery 1': 'Nursery 2',
    'Nursery 2': 'Primary 1',
    'Primary 1': 'Primary 2',
    'Primary 2': 'Primary 3',
    'Primary 3': 'Primary 4',
    'Primary 4': 'Primary 5',
    'Primary 5': null,
};

export const KG_SUBJECTS = [
    'Phonics / Letter Work', 'Number Work', 'Rhymes & Songs',
    'Creative Arts', 'Social Habits', 'Physical Development',
    'Bible Knowledge', 'Story Time',
];

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
