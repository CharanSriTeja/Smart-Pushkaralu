declare module 'react-native-worklets';
declare module '@react-native-firebase/app' {
  export function getApps(): any[];
  export function initializeApp(config: any): any;
  export function getApp(): any;
}
declare module '@react-native-firebase/auth' {
  export interface ConfirmationResult {
    confirm: (verificationCode: string) => Promise<any>;
    verificationId: string;
  }
  export function getAuth(app?: any): any;
  export function signInWithPhoneNumber(auth: any, phoneNumber: string): Promise<ConfirmationResult>;
  export function signOut(auth: any): Promise<void>;
  export function getIdToken(user: any): Promise<string>;
}
declare module '@react-native-firebase/messaging';
