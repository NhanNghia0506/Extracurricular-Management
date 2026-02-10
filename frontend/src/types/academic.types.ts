export interface Faculty {
    _id: string;
    name: string;
}

export interface ClassItem {
    _id: string;
    name: string;
    facultyId: string;
}
