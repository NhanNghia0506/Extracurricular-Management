import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './login.module.scss';
import InputGroup from '../InputGroup/input.group';
import logo from '../../assets/images/logoUniActivity.png';
import authService from '../../services/auth.service';

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ email, password });

            if (response.success) {
                // Đăng nhập thành công, chuyển hướng về trang chủ
                console.log('✅ Login successful:', response.data);
                console.log('👤 Current user:', authService.getCurrentUser());
                console.log('🔑 User role:', authService.getRole());
                navigate('/');
            } else {
                setError(response.message || 'Đăng nhập thất bại');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            {/* Phần Logo & Tiêu đề phía trên Card */}
            <div className={styles.header}>
                <img src={logo} alt="UniActivity Logo" className={styles.logoImage} />
                <p>Hệ thống quản lý ngoại khóa</p>
            </div>

            {/* Thẻ chứa Form đăng nhập */}
            <div className={styles.loginCard}>
                <form onSubmit={handleLogin}>
                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

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

                    <button
                        type="submit"
                        className={styles.loginBtn}
                        disabled={loading}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <div className={styles.linkRow}>
                        Chưa có tài khoản? <a className={styles.link} href="/register">Đăng ký</a>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default LoginForm;