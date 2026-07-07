export interface BrandInput {
    code?: string;
    name?: string;
    legalName?: string;
    description?: string;
    logo?: string;
    website?: string;
    email?: string;
    phone?: string;
}

export function validateBrandInput(data: BrandInput, isUpdate = false) {
    const errors: string[] = [];

    if (!isUpdate) {
        if (!data.code || data.code.trim() === '') {
            errors.push("Code is required");
        }
        if (!data.name || data.name.trim() === '') {
            errors.push("Name is required");
        }
    } else {
        if (data.code !== undefined && data.code.trim() === '') {
            errors.push("Code cannot be empty");
        }
        if (data.name !== undefined && data.name.trim() === '') {
            errors.push("Name cannot be empty");
        }
    }

    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push("Invalid email format");
        }
    }

    if (data.website) {
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlRegex.test(data.website)) {
            errors.push("Invalid website URL format");
        }
    }

    if (data.logo) {
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlRegex.test(data.logo)) {
            errors.push("Invalid logo URL format");
        }
    }

    if (data.phone) {
        // Basic international phone regex
        const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
        if (!phoneRegex.test(data.phone)) {
            errors.push("Invalid phone format");
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
