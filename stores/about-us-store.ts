"use client";

import { AboutUsMenuItem, AboutUsNode } from "@/services/about/get-menu";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AboutUsState {
  isAboutUsActive: boolean;
  menuItems: AboutUsMenuItem[];
  selectedSection: AboutUsNode | null;
  setIsAboutUsActive: (active: boolean) => void;
  setMenuItems: (items: AboutUsMenuItem[]) => void;
  setSelectedSection: (section: AboutUsNode | null) => void;
  resetAboutUs: () => void;
}

export const useAboutUsStore = create<AboutUsState>()(
  persist(
    (set) => ({
      isAboutUsActive: false,
      menuItems: [],
      selectedSection: null,

      setIsAboutUsActive: (active) => set({ isAboutUsActive: active }),
      setMenuItems: (items) => set({ menuItems: items }),
      setSelectedSection: (section) => set({ selectedSection: section }),
      resetAboutUs: () =>
        set({
          isAboutUsActive: false,
          menuItems: [],
          selectedSection: null,
        }),
    }),
    {
      name: "about-us-storage",
    }
  )
);
