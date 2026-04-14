import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminComplaints from '../components/Complaints/admin.complaints';

const AdminComplaintsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const organizerId = searchParams.get('organizerId') || undefined;

    return <AdminComplaints organizerId={organizerId} />;
};

export default AdminComplaintsPage;
