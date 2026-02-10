import { FilterOperator } from '../types';

export function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs.filter(Boolean).join(' ');
}

export const checkFilterMatch = (value: any, operator: FilterOperator, filterValue: any): boolean => {
    if (value === undefined || value === null) {
        return operator === 'is_empty';
    }
    const strValue = String(value).toLowerCase();
    
    // Handle array values for is_any_of / is_none_of
    if (Array.isArray(filterValue)) {
        const lowerFilterValues = filterValue.map(v => String(v).toLowerCase());
        if (operator === 'is_any_of') return lowerFilterValues.includes(strValue);
        if (operator === 'is_none_of') return !lowerFilterValues.includes(strValue);
        return false;
    }

    const strFilterValue = String(filterValue).toLowerCase();

    // Numerical check
    if (['lt', 'gt', 'lte', 'gte', 'eq', 'neq'].includes(operator)) {
        const numValue = parseFloat(value);
        const numFilterValue = parseFloat(filterValue);
        
        if (isNaN(numValue) || isNaN(numFilterValue)) return false;

        switch (operator) {
            case 'eq': return numValue === numFilterValue;
            case 'neq': return numValue !== numFilterValue;
            case 'gt': return numValue > numFilterValue;
            case 'lt': return numValue < numFilterValue;
            case 'gte': return numValue >= numFilterValue;
            case 'lte': return numValue <= numFilterValue;
            default: return false;
        }
    }

    switch (operator) {
        case 'contains': return strValue.includes(strFilterValue);
        case 'not_contains': return !strValue.includes(strFilterValue);
        case 'is': return strValue === strFilterValue;
        case 'is_not': return strValue !== strFilterValue;
        case 'is_empty': return strValue.trim() === '';
        case 'is_not_empty': return strValue.trim() !== '';
        default: return false;
    }
};
