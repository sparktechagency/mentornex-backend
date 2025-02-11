export type IContact = {
    name: string;
    email: string;
    phone: string;
    country: string;
    message: string;
  }
  
  export type IContactResponse = {
    success: boolean;
    message: string;
  }