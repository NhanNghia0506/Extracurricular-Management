import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import academicService from '../services/academic.service';
import { ClassItem, Faculty } from '../types/academic.types';

const AcademicManagementPage: React.FC = () => {
    const navigate = useNavigate();

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
    const [loadingFaculties, setLoadingFaculties] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);

    const [facultyForm, setFacultyForm] = useState({
        name: '',
        email: '',
        facultyCode: '',
        phone: '',
    });

    const [classForm, setClassForm] = useState({
        name: '',
        code: '',
        facultyId: '',
    });

    const [editingFacultyId, setEditingFacultyId] = useState<string>('');
    const [editFacultyForm, setEditFacultyForm] = useState({
        name: '',
        email: '',
        facultyCode: '',
        phone: '',
    });

    const [editingClassId, setEditingClassId] = useState<string>('');
    const [editClassForm, setEditClassForm] = useState({
        name: '',
        code: '',
        facultyId: '',
    });

    const [submittingFaculty, setSubmittingFaculty] = useState(false);
    const [submittingClass, setSubmittingClass] = useState(false);
    const [updatingFaculty, setUpdatingFaculty] = useState(false);
    const [updatingClass, setUpdatingClass] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const selectedFacultyName = useMemo(() => {
        return faculties.find((item) => item._id === selectedFacultyId)?.name || '';
    }, [faculties, selectedFacultyId]);

    const loadFaculties = useCallback(async () => {
        setLoadingFaculties(true);
        try {
            const response = await academicService.getFaculties();
            const payload = response.data;
            if (payload.success) {
                const nextFaculties = payload.data || [];
                setFaculties(nextFaculties);
                if (nextFaculties.length > 0) {
                    setSelectedFacultyId((previous) => previous || nextFaculties[0]._id);
                }
            } else {
                setError(payload.message || 'Không thể tải danh sách khoa');
            }
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách khoa');
        } finally {
            setLoadingFaculties(false);
        }
    }, []);

    const loadClasses = useCallback(async (facultyId: string) => {
        if (!facultyId) {
            setClasses([]);
            return;
        }

        setLoadingClasses(true);
        try {
            const response = await academicService.getClassesByFaculty(facultyId);
            const payload = response.data;
            if (payload.success) {
                setClasses(payload.data || []);
            } else {
                setError(payload.message || 'Không thể tải danh sách lớp');
            }
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách lớp');
        } finally {
            setLoadingClasses(false);
        }
    }, []);

    useEffect(() => {
        void loadFaculties();
    }, [loadFaculties]);

    useEffect(() => {
        if (selectedFacultyId) {
            void loadClasses(selectedFacultyId);
        }
    }, [selectedFacultyId, loadClasses]);

    const handleCreateFaculty = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage(null);
        setError(null);
        setSubmittingFaculty(true);
        try {
            const response = await academicService.createFaculty({
                name: facultyForm.name.trim(),
                email: facultyForm.email.trim(),
                facultyCode: facultyForm.facultyCode.trim(),
                phone: facultyForm.phone.trim(),
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Không thể tạo khoa');
            }

            setFacultyForm({ name: '', email: '', facultyCode: '', phone: '' });
            setMessage('Tạo khoa thành công');
            await loadFaculties();
        } catch (e) {
            const messageText = e instanceof Error ? e.message : 'Không thể tạo khoa';
            setError(messageText);
        } finally {
            setSubmittingFaculty(false);
        }
    };

    const handleCreateClass = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage(null);
        setError(null);

        const facultyId = classForm.facultyId || selectedFacultyId;
        if (!facultyId) {
            setError('Vui lòng chọn khoa trước khi tạo lớp');
            return;
        }

        setSubmittingClass(true);
        try {
            const response = await academicService.createClass({
                name: classForm.name.trim(),
                code: classForm.code.trim(),
                facultyId,
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Không thể tạo lớp');
            }

            setClassForm({ name: '', code: '', facultyId: facultyId });
            setSelectedFacultyId(facultyId);
            setMessage('Tạo lớp thành công');
            await loadClasses(facultyId);
        } catch (e) {
            const messageText = e instanceof Error ? e.message : 'Không thể tạo lớp';
            setError(messageText);
        } finally {
            setSubmittingClass(false);
        }
    };

    const startEditFaculty = (faculty: Faculty) => {
        setError(null);
        setMessage(null);
        setEditingFacultyId(faculty._id);
        setEditFacultyForm({
            name: faculty.name || '',
            email: faculty.email || '',
            facultyCode: faculty.facultyCode || '',
            phone: faculty.phone || '',
        });
    };

    const cancelEditFaculty = () => {
        setEditingFacultyId('');
        setEditFacultyForm({ name: '', email: '', facultyCode: '', phone: '' });
    };

    const handleUpdateFaculty = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editingFacultyId) {
            return;
        }

        setMessage(null);
        setError(null);
        setUpdatingFaculty(true);
        try {
            const response = await academicService.updateFaculty(editingFacultyId, {
                name: editFacultyForm.name.trim(),
                email: editFacultyForm.email.trim(),
                facultyCode: editFacultyForm.facultyCode.trim(),
                phone: editFacultyForm.phone.trim(),
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Không thể cập nhật khoa');
            }

            setMessage('Cập nhật khoa thành công');
            cancelEditFaculty();
            await loadFaculties();
            if (selectedFacultyId) {
                await loadClasses(selectedFacultyId);
            }
        } catch (e) {
            const messageText = e instanceof Error ? e.message : 'Không thể cập nhật khoa';
            setError(messageText);
        } finally {
            setUpdatingFaculty(false);
        }
    };

    const startEditClass = (item: ClassItem) => {
        setError(null);
        setMessage(null);
        setEditingClassId(item._id);
        setEditClassForm({
            name: item.name || '',
            code: item.code || '',
            facultyId: item.facultyId || selectedFacultyId,
        });
    };

    const cancelEditClass = () => {
        setEditingClassId('');
        setEditClassForm({ name: '', code: '', facultyId: '' });
    };

    const handleUpdateClass = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editingClassId) {
            return;
        }

        const facultyId = editClassForm.facultyId || selectedFacultyId;
        if (!facultyId) {
            setError('Vui lòng chọn khoa cho lớp');
            return;
        }

        setMessage(null);
        setError(null);
        setUpdatingClass(true);
        try {
            const response = await academicService.updateClass(editingClassId, {
                name: editClassForm.name.trim(),
                code: editClassForm.code.trim(),
                facultyId,
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Không thể cập nhật lớp');
            }

            setMessage('Cập nhật lớp thành công');
            cancelEditClass();
            if (selectedFacultyId === facultyId) {
                await loadClasses(facultyId);
            } else {
                setSelectedFacultyId(facultyId);
            }
        } catch (e) {
            const messageText = e instanceof Error ? e.message : 'Không thể cập nhật lớp';
            setError(messageText);
        } finally {
            setUpdatingClass(false);
        }
    };

    return (
        <div className="container py-4" style={{ maxWidth: 1100 }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-1">Quản lý Khoa và Lớp</h2>
                    <p className="text-muted mb-0">Chức năng dành cho quản trị viên để tạo dữ liệu học thuật.</p>
                </div>
                <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                    Quay lại
                </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Tạo khoa</h5>
                            <form onSubmit={handleCreateFaculty}>
                                <div className="mb-3">
                                    <label className="form-label">Tên khoa</label>
                                    <input
                                        className="form-control"
                                        value={facultyForm.name}
                                        onChange={(e) => setFacultyForm((prev) => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email khoa</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={facultyForm.email}
                                        onChange={(e) => setFacultyForm((prev) => ({ ...prev, email: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Mã khoa</label>
                                    <input
                                        className="form-control"
                                        value={facultyForm.facultyCode}
                                        onChange={(e) => setFacultyForm((prev) => ({ ...prev, facultyCode: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Số điện thoại</label>
                                    <input
                                        className="form-control"
                                        value={facultyForm.phone}
                                        onChange={(e) => setFacultyForm((prev) => ({ ...prev, phone: e.target.value }))}
                                        required
                                    />
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={submittingFaculty}>
                                    {submittingFaculty ? 'Đang tạo...' : 'Tạo khoa'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Tạo lớp</h5>
                            <form onSubmit={handleCreateClass}>
                                <div className="mb-3">
                                    <label className="form-label">Khoa</label>
                                    <select
                                        className="form-select"
                                        value={classForm.facultyId || selectedFacultyId}
                                        onChange={(e) => {
                                            setClassForm((prev) => ({ ...prev, facultyId: e.target.value }));
                                            setSelectedFacultyId(e.target.value);
                                        }}
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
                                <div className="mb-3">
                                    <label className="form-label">Tên lớp</label>
                                    <input
                                        className="form-control"
                                        value={classForm.name}
                                        onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Mã lớp</label>
                                    <input
                                        className="form-control"
                                        value={classForm.code}
                                        onChange={(e) => setClassForm((prev) => ({ ...prev, code: e.target.value }))}
                                        required
                                    />
                                </div>
                                <button className="btn btn-primary" type="submit" disabled={submittingClass}>
                                    {submittingClass ? 'Đang tạo...' : 'Tạo lớp'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mt-1">
                <div className="col-12 col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Danh sách khoa</h5>
                            {loadingFaculties ? (
                                <p className="text-muted mb-0">Đang tải khoa...</p>
                            ) : faculties.length === 0 ? (
                                <p className="text-muted mb-0">Chưa có khoa nào.</p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {faculties.map((faculty) => (
                                        <li key={faculty._id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <div>
                                                <strong>{faculty.name}</strong>
                                                <div className="small text-muted">{faculty.facultyCode || 'Không có mã khoa'}</div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setSelectedFacultyId(faculty._id)}
                                                >
                                                    Xem lớp
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-warning"
                                                    onClick={() => startEditFaculty(faculty)}
                                                >
                                                    Sửa
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-3">
                                Danh sách lớp{selectedFacultyName ? ` - ${selectedFacultyName}` : ''}
                            </h5>
                            {!selectedFacultyId ? (
                                <p className="text-muted mb-0">Chọn khoa để xem danh sách lớp.</p>
                            ) : loadingClasses ? (
                                <p className="text-muted mb-0">Đang tải lớp...</p>
                            ) : classes.length === 0 ? (
                                <p className="text-muted mb-0">Khoa này chưa có lớp nào.</p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {classes.map((item) => (
                                        <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <div>
                                                <strong>{item.name}</strong>
                                                <div className="small text-muted">{item.code || 'Không có mã lớp'}</div>
                                            </div>
                                            <button className="btn btn-sm btn-outline-warning" onClick={() => startEditClass(item)}>
                                                Sửa
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {(editingFacultyId || editingClassId) && (
                <div className="row g-4 mt-1">
                    <div className="col-12 col-lg-6">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <h5 className="card-title mb-3">Chỉnh sửa khoa</h5>
                                {!editingFacultyId ? (
                                    <p className="text-muted mb-0">Chọn nút Sửa trong danh sách khoa để cập nhật thông tin.</p>
                                ) : (
                                    <form onSubmit={handleUpdateFaculty}>
                                        <div className="mb-3">
                                            <label className="form-label">Tên khoa</label>
                                            <input
                                                className="form-control"
                                                value={editFacultyForm.name}
                                                onChange={(e) => setEditFacultyForm((prev) => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email khoa</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editFacultyForm.email}
                                                onChange={(e) => setEditFacultyForm((prev) => ({ ...prev, email: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Mã khoa</label>
                                            <input
                                                className="form-control"
                                                value={editFacultyForm.facultyCode}
                                                onChange={(e) => setEditFacultyForm((prev) => ({ ...prev, facultyCode: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Số điện thoại</label>
                                            <input
                                                className="form-control"
                                                value={editFacultyForm.phone}
                                                onChange={(e) => setEditFacultyForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-warning" type="submit" disabled={updatingFaculty}>
                                                {updatingFaculty ? 'Đang lưu...' : 'Lưu thay đổi'}
                                            </button>
                                            <button className="btn btn-outline-secondary" type="button" onClick={cancelEditFaculty}>
                                                Hủy
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-6">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <h5 className="card-title mb-3">Chỉnh sửa lớp</h5>
                                {!editingClassId ? (
                                    <p className="text-muted mb-0">Chọn nút Sửa trong danh sách lớp để cập nhật thông tin.</p>
                                ) : (
                                    <form onSubmit={handleUpdateClass}>
                                        <div className="mb-3">
                                            <label className="form-label">Khoa</label>
                                            <select
                                                className="form-select"
                                                value={editClassForm.facultyId}
                                                onChange={(e) => setEditClassForm((prev) => ({ ...prev, facultyId: e.target.value }))}
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
                                        <div className="mb-3">
                                            <label className="form-label">Tên lớp</label>
                                            <input
                                                className="form-control"
                                                value={editClassForm.name}
                                                onChange={(e) => setEditClassForm((prev) => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Mã lớp</label>
                                            <input
                                                className="form-control"
                                                value={editClassForm.code}
                                                onChange={(e) => setEditClassForm((prev) => ({ ...prev, code: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-warning" type="submit" disabled={updatingClass}>
                                                {updatingClass ? 'Đang lưu...' : 'Lưu thay đổi'}
                                            </button>
                                            <button className="btn btn-outline-secondary" type="button" onClick={cancelEditClass}>
                                                Hủy
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicManagementPage;
