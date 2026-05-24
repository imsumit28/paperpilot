'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const DEFAULT_SCHOOL_LOGO = '/avatars/delhi-public-school.svg';

interface AuthState {
  isAuthenticated: boolean;
  teacherName: string;
  schoolName: string;
  schoolAddress: string;
  schoolLogo: string;
  loginOrRegister: (payload: {
    teacherName: string;
    schoolName: string;
    schoolAddress?: string;
    schoolLogo?: string;
  }) => void;
  updateSchool: (payload: {
    teacherName?: string;
    schoolName?: string;
    schoolAddress?: string;
    schoolLogo?: string;
  }) => void;
  resetSchoolLogo: () => void;
  logout: () => void;
}

const initialState = {
  isAuthenticated: false,
  teacherName: 'John Doe',
  schoolName: 'Delhi Public School',
  schoolAddress: 'Bokaro Steel City',
  schoolLogo: DEFAULT_SCHOOL_LOGO,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      loginOrRegister: ({ teacherName, schoolName, schoolAddress, schoolLogo }) =>
        set({
          isAuthenticated: true,
          teacherName: teacherName.trim() || initialState.teacherName,
          schoolName: schoolName.trim() || initialState.schoolName,
          schoolAddress: schoolAddress?.trim() || initialState.schoolAddress,
          schoolLogo: schoolLogo || initialState.schoolLogo,
        }),
      updateSchool: ({ teacherName, schoolName, schoolAddress, schoolLogo }) =>
        set((s) => ({
          teacherName: teacherName !== undefined
            ? (teacherName.trim() || initialState.teacherName)
            : s.teacherName,
          schoolName: schoolName !== undefined
            ? (schoolName.trim() || initialState.schoolName)
            : s.schoolName,
          schoolAddress: schoolAddress !== undefined
            ? (schoolAddress.trim() || initialState.schoolAddress)
            : s.schoolAddress,
          schoolLogo: schoolLogo !== undefined
            ? (schoolLogo || initialState.schoolLogo)
            : s.schoolLogo,
        })),
      resetSchoolLogo: () => set({ schoolLogo: DEFAULT_SCHOOL_LOGO }),
      logout: () => set({ ...initialState }),
    }),
    {
      name: 'paper-pilot-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { DEFAULT_SCHOOL_LOGO };
