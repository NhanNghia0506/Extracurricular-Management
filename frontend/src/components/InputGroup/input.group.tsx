import React, { useState } from 'react';
import styles from '../LoginForm/login.module.scss';

interface InputGroupProps {
    label: string;
    type: string;
    placeholder: string;
    isPassword?: boolean;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ 
    label, 
    type, 
    placeholder, 
    isPassword,
    value,
    onChange,
    required
}) => {
    const [showPassword, setShowPassword] = useState(false);

    // Logic chuyển đổi type từ password sang text để hiện mật khẩu
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className={styles.inputGroup}>
            <label>{label}</label>
            <div className={styles.inputWrapper}>
                <input 
                    type={inputType} 
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                />

                {isPassword && (
                    <i
                        className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.eyeIcon}`}
                        onClick={() => setShowPassword(!showPassword)}
                    ></i>
                )}
            </div>
        </div>
    );
};

export default InputGroup;