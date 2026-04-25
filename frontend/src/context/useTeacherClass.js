import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { useAuth } from './AuthContext';

/**
 * Resolves the currently-logged-in teacher's class.
 * Returns { teacher, classLevel, loading, error }.
 * classLevel === null means the teacher isn't a class teacher (subject-only).
 */
export default function useTeacherClass() {
    const { profile } = useAuth();
    const [teacher, setTeacher] = useState(null);
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
                if (t.class_teacher_of) {
                    const { data: cl } = await axios.get(`${API_URL}/api/academics/classes/${t.class_teacher_of}/`);
                    if (!cancelled) setClassLevel(cl);
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

    return { teacher, classLevel, loading, error };
}
