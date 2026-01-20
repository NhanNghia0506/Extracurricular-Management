import React from 'react';
import PostCard, { PostData } from '../../../components/PostCard/postcard';

// DỮ LIỆU GIẢ LẬP (MOCK DATA) - Giống hệt hình ảnh
const POSTS: PostData[] = [
    {
        id: '1',
        title: 'Annual Hackathon 2024',
        organization: 'Computer Science Society',
        orgIcon: 'fa-solid fa-code', // Icon code
        orgColor: 'blue',
        status: 'OPEN',
        image: 'https://cdn.dribbble.com/users/1200062/screenshots/16382974/media/3f080775d1607b32252b472851493025.png?resize=800x600&vertical=center', // Ảnh minh họa hackathon
        description: 'Join us for 48 hours of innovation, coding, and networking. No experience required, just bring your enthusiasm!',
        location: 'Main Campus, Lab 402',
        points: 150,
        participants: [
            'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
        ],
        participantCount: 42
    },
    {
        id: '2',
        title: 'Creative Arts Workshop',
        organization: 'Fine Arts Club',
        orgIcon: 'fa-solid fa-palette', // Icon bảng vẽ
        orgColor: 'orange',
        status: 'WAITLIST',
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop', // Ảnh minh họa nghệ thuật
        description: 'Explore different mediums of expression. This weekend we focus on watercolor techniques and urban sketching.',
        location: 'Student Union, Level 2',
        points: 80,
        participants: [
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
        ],
        participantCount: 15
    }
];

const Feed: React.FC = () => {
    return (
        <div className="container-fluid p-0" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Tiêu đề trang nếu cần */}
            {/* <h4 className="mb-4 fw-bold">Latest Activities</h4> */}

            {/* Duyệt qua mảng và render Card */}
            {POSTS.map((post) => (
                <PostCard key={post.id} data={post} />
            ))}

            {/* Loading Spinner (Giả lập cuộn vô tận) */}
            <div className="text-center py-4 text-muted">
                <i className="fa-solid fa-spinner fa-spin me-2"></i>
                Loading more activities...
            </div>
        </div>
    );
};

export default Feed;