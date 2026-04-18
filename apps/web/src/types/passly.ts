/**
 * Types for the password generator tool
 */

export interface CharacterOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export interface PasswordEntry {
  id: string;
  value: string;
}

export interface GeneratePasswordRequest {
  length: number;
  options: CharacterOptions;
}

export interface GeneratePasswordResponse {
  success: boolean;
  passwords: string[];
}
