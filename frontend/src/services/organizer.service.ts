import apiService from "./api.service";

const organizerService = {
    myOrganizations: (userId: string) => apiService.get(`/organizer-members/my-organizations/${userId}`),
}

export default organizerService;