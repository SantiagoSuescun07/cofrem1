import api from "@/lib/axios";
import { apiBaseUrl } from "@/constants";

export interface Birthday {
  name: string;
  field_birthdate: string;
  uid: string;
  user_picture?: string;
  field_full_name?: string;
  email?: string;
  profileImage?: string;
  area?: string;
}

export const getBirthdays = async (): Promise<Birthday[]> => {
  const { data } = await api.get<Birthday[]>("/api/birthday");
  console.log("DATA dd: ", data)
  return data
    .filter((person) => person.field_birthdate)
    .map((person) => {
      let profileImage: string | undefined = undefined;
      if (person.user_picture) {
        const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
        const picturePath = person.user_picture.startsWith('/') 
          ? person.user_picture 
          : `/${person.user_picture}`;
        profileImage = `${baseUrl}${picturePath}`;
      }
      return {
        ...person,
        profileImage,
      };
    });
};