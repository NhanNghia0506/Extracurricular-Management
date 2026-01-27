import { Injectable } from "@nestjs/common";
import { OrganizerRepository } from "./organizer.repository";
import { CreateOrganizerDto } from "./dtos/create.organizer.dto";

@Injectable()
export class OrganizerService {
    constructor(
        private readonly organizerRepository: OrganizerRepository
    ) {}

    create(organizerData: CreateOrganizerDto) {
        const organizer = {
            name: organizerData.name,
            email: organizerData.email,
            phone: organizerData.phone,
        };

        return this.organizerRepository.create(organizer);
    }

    findAll() {
        return this.organizerRepository.findAll();
    }

    findById(id: string) {
        return this.organizerRepository.findById(id);
    }

    update(id: string, organizerData: Partial<CreateOrganizerDto>) {
        return this.organizerRepository.update(id, organizerData);
    }

    delete(id: string) {
        return this.organizerRepository.delete(id);
    }
}
