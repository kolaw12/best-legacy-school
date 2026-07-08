import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { useAuth } from './AuthContext';

/**
 * Resolves every class the logged-in teacher can act on: the one class they're
 * homeroom ("class teacher") for, plus any classes they teach a subject in
 * (Teacher.classes on the backend). A teacher with no homeroom class but one
 * or more subject classes previously fell through the cracks here and saw
 * "no class assigned" everywhere, including grade entry — this hook used to
 * only ever look at class_teacher_of.
 *
 * Returns { teacher, classes, classLevel, setClassLevel, isClassTeacher, loading, error }.
 * `classLevel` is the currently-selected class (defaults to the homeroom
 * class if there is one, else the first subject class); `setClassLevel` lets
 * a teacher with more than one class switch between them.
 */
export default function useTeacherClass() {
    const { profile } = useAuth();
    const [teacher, setTeacher] = useState(null);
    const [classes, setClasses] = useState([]);
    const [classLevel, setClassLevel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const teacherId = profile?.teacher;
                if (!teacherId) {
                    if (!cancelled) setLoading(false);
                    return;
                }
                const { data: t } = await axios.get(`${API_URL}/api/academics/teachers/${teacherId}/`);
                if (cancelled) return;
                setTeacher(t);

                const classIds = new Set(t.classes || []);
                if (t.class_teacher_of) classIds.add(t.class_teacher_of);

                if (classIds.size) {
                    const { data: all } = await axios.get(`${API_URL}/api/academics/classes/`);
                    if (cancelled) return;
                    const mine = (all || [])
                        .filter(c => classIds.has(c.id))
                        .sort((a, b) => a.order - b.order);
                    setClasses(mine);
                    const homeroom = mine.find(c => c.id === t.class_teacher_of);
                    setClassLevel(homeroom || mine[0] || null);
                }
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [profile?.teacher]);

    const isClassTeacher = useMemo(
        () => !!(teacher && classLevel && teacher.class_teacher_of === classLevel.id),
        [teacher, classLevel],
    );

    return { teacher, classes, classLevel, setClassLevel, isClassTeacher, loading, error };
}
