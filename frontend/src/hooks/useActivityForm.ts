import { useState, useRef, useEffect } from 'react';

export const useActivityForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [organizerId, setOrganizerId] = useState('');
    const [location, setLocation] = useState('University Central Courtyard, Wing A');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [trainingScore, setTrainingScore] = useState<number>(0);
    const [participantCount, setParticipantCount] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        return () => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
        };
    }, [coverPreview]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Lưu File object
        setCoverFile(file);

        // Lưu preview URL
        const previewUrl = URL.createObjectURL(file);
        setCoverPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return previewUrl;
        });

        setUploading(false);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategoryId('');
        setOrganizerId('');
        setStartAt('');
        setEndAt('');
        setTrainingScore(0);
        setParticipantCount(0);
        setCoverFile(null);
        setCoverPreview(null);
    };

    return {
        // States
        title,
        description,
        categoryId,
        organizerId,
        location,
        coverFile,
        coverPreview,
        uploading,
        startAt,
        endAt,
        trainingScore,
        participantCount,
        submitting,
        errorMessage,
        fileInputRef,
        // Setters
        setTitle,
        setDescription,
        setCategoryId,
        setOrganizerId,
        setLocation,
        setTrainingScore,
        setParticipantCount,
        setCoverFile,
        setCoverPreview,
        setUploading,
        setStartAt,
        setEndAt,
        setSubmitting,
        setErrorMessage,
        // Functions
        handleUploadClick,
        handleCoverFileChange,
        resetForm
    };
};
