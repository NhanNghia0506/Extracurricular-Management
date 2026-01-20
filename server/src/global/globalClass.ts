import { ResponseDataProps } from './globalInterface';

export class ResponseData<T> {
    readonly data: T | T[];
    readonly statusCode: number;
    readonly message: string;

    constructor(props: ResponseDataProps<T>) {
        Object.assign(this, props);
        return this;
    }
}
