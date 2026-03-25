import { useState, useEffect, useCallback } from 'react';
import activityCategoryService, { ActivityCategory } from '../services/activityCategory.service';

export const useActivityCategories = () => {
    const [categories, setCategories] = useState<ActivityCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all categories
    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await activityCategoryService.getAll();

            if (response.data?.success && Array.isArray(response.data.data)) {
                setCategories(response.data.data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
            setError(errorMessage);
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Create category
    const createCategory = useCallback(async (name: string) => {
        try {
            setError(null);
            const response = await activityCategoryService.create({ name });

            if (response.data?.success && response.data.data) {
                setCategories(prev => [...prev, response.data.data]);
                return response.data.data;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
            setError(errorMessage);
            throw err;
        }
    }, []);

    // Update category
    const updateCategory = useCallback(async (id: string, name: string) => {
        try {
            setError(null);
            const response = await activityCategoryService.update(id, { name });

            if (response.data?.success && response.data.data) {
                setCategories(prev => prev.map(cat => cat._id === id ? response.data.data : cat));
                return response.data.data;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
            setError(errorMessage);
            throw err;
        }
    }, []);

    // Delete category
    const deleteCategory = useCallback(async (id: string) => {
        try {
            setError(null);
            await activityCategoryService.delete(id);
            setCategories(prev => prev.filter(cat => cat._id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
            setError(errorMessage);
            throw err;
        }
    }, []);

    return {
        categories,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    };
};
