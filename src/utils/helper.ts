import { defaultFilterOptions, sortBy, sortByMapper, Iprice } from './constant';

export const priceRange = ({ from, to }: Iprice): Iprice => {
    return { from: from || 0, to: to || 1000000000 };
};

export const skipNumber = (page: string | undefined): Number =>
    !page || page === '1' ? 0 : parseInt(page) * defaultFilterOptions.limit;

export const productsForTheWeek = (id: any) =>
    Date.now() - id.getTimestamp() < 7 * 24 * 60 * 60 * 1000;

export const sortByFormatter = (sortType: sortBy): number => sortByMapper[sortType];

export const parsedOptions = (options: string | undefined | object) =>
    options && typeof options === 'string'
        ? JSON.parse(options)
        : options && typeof options === 'object'
        ? options
        : null;

export const validateEmail = (email: string): boolean => {
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};
