export declare class CreateProviderDto {
    tradeCategory: string;
    location: string;
    bio?: string;
    priceRange?: string;
}
export declare class UpdateProviderDto {
    bio?: string;
    tradeCategory?: string;
    location?: string;
    priceRange?: string;
    isAvailable?: boolean;
    portfolioUrls?: string[];
}
export declare class SearchProvidersDto {
    search?: string;
    tradeCategory?: string;
    location?: string;
    minRating?: number;
    page?: number;
    pageSize?: number;
}
