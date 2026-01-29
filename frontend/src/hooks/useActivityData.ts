import { useState, useEffect } from 'react';
import activityService from '../services/activity.service';
import organizerService from '../services/organizer.service';
import authService from '../services/auth.service';

export const useActivityData = () => {
    const [organizers, setOrganizers] = useState<Array<{ id: string; name: string }>>([]);
    const [loadingOrganizers, setLoadingOrganizers] = useState(false);
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Fetch danh sách organizer của user
    useEffect(() => {
        const fetchMyOrganizations = async () => {
            try {
                const userInfo = authService.getCurrentUser();
                if (!userInfo?.id) return;

                setLoadingOrganizers(true);
                const response = await organizerService.myOrganizations(userInfo.id);

                if (response.data?.success && response.data?.data) {
                    const organizerList = response.data.data.map((item: any) => ({
                        id: item.organizerId?._id || item.organizerId,
                        name: item.organizerId?.name || 'Unknown'
                    }));
                    setOrganizers(organizerList);
                }
            } catch (error) {
                console.error('Lỗi fetch organizers:', error);
            } finally {
                setLoadingOrganizers(false);
            }
        };

        fetchMyOrganizations();
    }, []);

    // Fetch danh sách categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await activityService.categories();

                if (response.data?.success && response.data?.data) {
                    const categoriesList = response.data.data.map((item: any) => ({
                        id: item._id || item.id,
                        name: item.name || 'Unknown'
                    }));
                    setCategories(categoriesList);
                }
            } catch (error) {
                console.error('Lỗi fetch categories:', error);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    return {
        organizers,
        loadingOrganizers,
        categories,
        loadingCategories
    };
};
