// mobile/src/utils/errorHandler.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// =====================================================
// ERROR TYPES AND CODES
// =====================================================
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  CACHE: 'CACHE_ERROR',
  NFC: 'NFC_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

export const ErrorCodes = {
  // Network errors
  NO_INTERNET: 'NO_INTERNET_CONNECTION',
  TIMEOUT: 'REQUEST_TIMEOUT',
  SERVER_UNREACHABLE: 'SERVER_UNREACHABLE',
  
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_EMAIL_PASSWORD',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  
  // Permission errors
  LOCATION_DENIED: 'LOCATION_PERMISSION_DENIED',
  CAMERA_DENIED: 'CAMERA_PERMISSION_DENIED',
  STORAGE_DENIED: 'STORAGE_PERMISSION_DENIED',
  PERMISSION_DENIED: 'GENERIC_PERMISSION_DENIED',
  
  // Validation errors
  INVALID_EMAIL: 'INVALID_EMAIL_FORMAT',
  WEAK_PASSWORD: 'PASSWORD_TOO_WEAK',
  REQUIRED_FIELD: 'REQUIRED_FIELD_MISSING',
  
  // NFC errors
  NFC_NOT_SUPPORTED: 'NFC_NOT_SUPPORTED',
  NFC_DISABLED: 'NFC_DISABLED',
  TAG_READ_ERROR: 'NFC_TAG_READ_ERROR',
  
  // Server errors
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE: 'SERVER_MAINTENANCE',
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR'
};

// =====================================================
// ERROR HANDLER CLASS
// =====================================================
export class ErrorHandler {
  static errorLog = [];
  static maxLogSize = 100;

  static handle(error, context = '') {
    const errorInfo = this.analyzeError(error, context);
    this.logError(errorInfo);
    return this.getUserFriendlyMessage(errorInfo);
  }

  static analyzeError(error, context) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      originalMessage: error.message,
      stack: error.stack,
      type: ErrorTypes.UNKNOWN,
      code: null,
      severity: 'medium',
      userMessage: 'Wystąpił nieoczekiwany błąd',
      actionRequired: false,
      retryable: true
    };

    const message = error.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      errorInfo.type = ErrorTypes.NETWORK;
      errorInfo.retryable = true;
      errorInfo.severity = 'high';

      if (message.includes('timeout')) {
        errorInfo.code = ErrorCodes.TIMEOUT;
        errorInfo.userMessage = 'Przekroczono czas oczekiwania. Sprawdź połączenie internetowe.';
      } else if (message.includes('offline') || message.includes('no internet')) {
        errorInfo.code = ErrorCodes.NO_INTERNET;
        errorInfo.userMessage = 'Brak połączenia z internetem. Sprawdź swoje połączenie.';
        errorInfo.actionRequired = true;
      } else if (message.includes('server unreachable') || message.includes('network request failed')) {
        errorInfo.code = ErrorCodes.SERVER_UNREACHABLE;
        errorInfo.userMessage = 'Nie można połączyć się z serwerem. Spróbuj ponownie.';
      } else {
        errorInfo.userMessage = 'Brak wymaganych uprawnień. Sprawdź ustawienia aplikacji.';
      }
    } else if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      errorInfo.type = ErrorTypes.VALIDATION;
      errorInfo.retryable = false;
      errorInfo.severity = 'low';
      errorInfo.actionRequired = true;

      if (message.includes('email')) {
        errorInfo.code = ErrorCodes.INVALID_EMAIL;
        errorInfo.userMessage = 'Podaj prawidłowy adres email.';
      } else if (message.includes('password')) {
        errorInfo.code = ErrorCodes.WEAK_PASSWORD;
        errorInfo.userMessage = 'Hasło musi mieć co najmniej 6 znaków.';
      } else {
        errorInfo.code = ErrorCodes.REQUIRED_FIELD;
        errorInfo.userMessage = 'Wypełnij wszystkie wymagane pola.';
      }
    } else if (message.includes('nfc')) {
      errorInfo.type = ErrorTypes.NFC;
      errorInfo.severity = 'medium';

      if (message.includes('not supported')) {
        errorInfo.code = ErrorCodes.NFC_NOT_SUPPORTED;
        errorInfo.userMessage = 'To urządzenie nie obsługuje technologii NFC.';
        errorInfo.retryable = false;
        errorInfo.actionRequired = true;
      } else if (message.includes('disabled')) {
        errorInfo.code = ErrorCodes.NFC_DISABLED;
        errorInfo.userMessage = 'Włącz NFC w ustawieniach urządzenia.';
        errorInfo.retryable = false;
        errorInfo.actionRequired = true;
      } else {
        errorInfo.code = ErrorCodes.TAG_READ_ERROR;
        errorInfo.userMessage = 'Nie udało się odczytać świecy. Spróbuj ponownie.';
        errorInfo.retryable = true;
      }
    } else if (message.includes('500') || message.includes('server error')) {
      errorInfo.type = ErrorTypes.SERVER;
      errorInfo.code = ErrorCodes.INTERNAL_ERROR;
      errorInfo.userMessage = 'Problem z serwerem. Spróbuj ponownie za chwilę.';
      errorInfo.retryable = true;
      errorInfo.severity = 'high';
    } else if (message.includes('429') || message.includes('rate limit')) {
      errorInfo.type = ErrorTypes.SERVER;
      errorInfo.code = ErrorCodes.RATE_LIMIT;
      errorInfo.userMessage = 'Zbyt wiele prób. Poczekaj chwilę przed ponowną próbą.';
      errorInfo.retryable = true;
      errorInfo.severity = 'medium';
    } else if (message.includes('auth') || message.includes('login') || message.includes('session')) {
      errorInfo.type = ErrorTypes.AUTH;
      errorInfo.retryable = false;
      errorInfo.severity = 'high';
      errorInfo.actionRequired = true;

      if (message.includes('invalid') || message.includes('credentials')) {
        errorInfo.code = ErrorCodes.INVALID_CREDENTIALS;
        errorInfo.userMessage = 'Nieprawidłowy email lub hasło.';
      } else if (message.includes('not found') || message.includes('user')) {
        errorInfo.code = ErrorCodes.USER_NOT_FOUND;
        errorInfo.userMessage = 'Nie znaleziono użytkownika o podanym adresie email.';
      } else if (message.includes('expired') || message.includes('session')) {
        errorInfo.code = ErrorCodes.SESSION_EXPIRED;
        errorInfo.userMessage = 'Sesja wygasła. Zaloguj się ponownie.';
      } else if (message.includes('email') && message.includes('confirm')) {
        errorInfo.code = ErrorCodes.EMAIL_NOT_CONFIRMED;
        errorInfo.userMessage = 'Potwierdź swój adres email przed logowaniem.';
      }
    } else if (message.includes('permission') || message.includes('denied')) {
      errorInfo.type = ErrorTypes.PERMISSION;
      errorInfo.retryable = false;
      errorInfo.actionRequired = true;
      errorInfo.severity = 'medium';

      if (message.includes('location')) {
        errorInfo.code = ErrorCodes.LOCATION_DENIED;
        errorInfo.userMessage = 'Wymagane jest uprawnienie do lokalizacji.';
      } else if (message.includes('camera')) {
        errorInfo.code = ErrorCodes.CAMERA_DENIED;
        errorInfo.userMessage = 'Wymagane jest uprawnienie do kamery.';
      } else {
        errorInfo.code = ErrorCodes.PERMISSION_DENIED;
        errorInfo.userMessage = 'Brak wymaganych uprawnień.';
      }
    }

    return errorInfo;
  }

  // ...pozostała część klasy ErrorHandler (logowanie, getUserFriendlyMessage, itp.)
}