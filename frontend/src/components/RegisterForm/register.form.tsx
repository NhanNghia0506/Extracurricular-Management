import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../LoginForm/login.module.scss';
import InputGroup from '../InputGroup/input.group';
import logo from '../../assets/images/logoUniActivity.png';
import authService from '../../services/auth.service';
import academicService from '../../services/academic.service';
import { ClassItem, Faculty } from '../../types/academic.types';
import { RegisterRequest, UserType } from '../../types/auth.types';

const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState<UserType>('STUDENT');
    const [code, setCode] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [classId, setClassId] = useState('');
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isStudent = useMemo(() => userType === 'STUDENT', [userType]);

    useEffect(() => {
        const loadFaculties = async () => {
            try {
                const response = await academicService.getFaculties();
                if (response.data.success) {
                    setFaculties(response.data.data || []);
                }
            } catch (err) {
                // Intentionally silent; form can still work without list.
            }
        };

        loadFaculties();
    }, []);

    useEffect(() => {
        if (!isStudent) {
            setClassId('');
            setClasses([]);
            return;
        }

        if (!facultyId) {
            setClasses([]);
            setClassId('');
            return;
        }

        const loadClasses = async () => {
            try {
                const response = await academicService.getClassesByFaculty(facultyId);
                if (response.data.success) {
                    setClasses(response.data.data || []);
                }
            } catch (err) {
                setClasses([]);
            }
        };

        loadClasses();
    }, [facultyId, isStudent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim() || !password.trim() || !code.trim()) {
            setError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
            return;
        }

        if (!facultyId) {
            setError('Vui lòng chọn khoa.');
            return;
        }

        if (isStudent && !classId) {
            setError('Vui lòng chọn lớp.');
            return;
        }

        const payload: RegisterRequest = {
            name: name.trim(),
            email: email.trim(),
            password,
            userType,
            code: code.trim(),
            facultyId,
            classId: isStudent ? classId : undefined,
        };

        setLoading(true);
        try {
            const response = await authService.register(payload);
            if (response.success) {
                navigate('/login');
                return;
            }

            setError(response.message || 'Đăng ký thất bại');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.header}>
                <img src={logo} alt="UniActivity Logo" className={styles.logoImage} />
                <p>Hệ thống quản lý ngoại khóa</p>
            </div>

            <div className={styles.loginCard}>
                <form onSubmit={handleSubmit}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <InputGroup
                        label="Họ và tên"
                        type="text"
                        placeholder="Nguyen Van A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <InputGroup
                        label="Email"
                        type="email"
                        placeholder="yourname@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <InputGroup
                        label="Mật khẩu"
                        type="password"
                        placeholder="••••••••"
                        isPassword={true}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div className={styles.inputGroup}>
                        <label>Loại người dùng</label>
                        <div className={styles.inputWrapper}>
                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value as UserType)}
                                required
                            >
                                <option value="STUDENT">Sinh viên</option>
                                <option value="TEACHER">Giảng viên</option>
                            </select>
                        </div>
                    </div>

                    <InputGroup
                        label="Mã số"
                        type="text"
                        placeholder={isStudent ? 'Mã số sinh viên' : 'Mã số giảng viên'}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />

                    <div className={styles.inputGroup}>
                        <label>Khoa</label>
                        <div className={styles.inputWrapper}>
                            <select
                                value={facultyId}
                                onChange={(e) => setFacultyId(e.target.value)}
                                required
                            >
                                <option value="">Chọn khoa</option>
                                {faculties.map((faculty) => (
                                    <option key={faculty._id} value={faculty._id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isStudent && (
                        <div className={styles.inputGroup}>
                            <label>Lớp</label>
                            <div className={styles.inputWrapper}>
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    required
                                    disabled={!facultyId}
                                >
                                    <option value="">Chọn lớp</option>
                                    {classes.map((cls) => (
                                        <option key={cls._id} value={cls._id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>

                    <div className={styles.linkRow}>
                        Đã có tài khoản? <a className={styles.link} href="/login">Đăng nhập</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterForm;
