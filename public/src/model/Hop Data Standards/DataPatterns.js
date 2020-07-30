/* 
 * Data code constants patterns. These regular expressions will define the format of each data point for a
 * HopBale. The intention is to use these regulare expressions to validate data point values. They will be 
 * made available from this file for quick easy reference through out the application. The order of these 
 * constants is important. Don't rearrange them as they line up one to one with the DataCodes  in the 
 * DataCodes file.
 */
export const BALE_ID_PATTERN = /^\d+$/; // Look for an infinite string of only digits. No empty strings
export const FIELD_ID_PATTERN = /^\d{2,}$/; // two or more digits
export const FACIL_ID_PATTERN = /^\d{1,}$/; // one or more digits
export const LOT_NUM_PATTERN = /^[a-z]{2,}\d{8,}$/i; // Custom pattern 2 letters followed by 8 numbers
export const WEIGHT_PATTERN = /^\d+ (lbs|kgs)$/; // ex: 100 lbs OR 100 kg at least one digit with space between number and unit
export const DRY_MAT_PATTERN = /^\d{1,3}%$/; // between one and three digits followed by "%"
export const HOP_VAR_PATTERN = /\w+/; // No empty string  
export const DATE_BALED_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/; // ISO date format:
// year-month-dayThour:minute:secondZ (YYYY-MM-DDTHH:MM:SSZ)

