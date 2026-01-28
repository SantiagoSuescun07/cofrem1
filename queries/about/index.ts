import { ABOUT_US_MENU, ABOUT_US_NODE } from "@/constants/about-keys";
import {
  AboutUsMenuItem,
  AboutUsNode,
  fetchAboutUsMenu,
  fetchAboutUsNode,
} from "@/services/about/get-menu";
import { useQuery } from "@tanstack/react-query";

export const useAboutUsMenu = () =>
  useQuery<AboutUsMenuItem[]>({
    queryKey: [ABOUT_US_MENU],
    queryFn: fetchAboutUsMenu,
  });

// 🔹 Query para obtener una sección específica
export const useAboutUsNode = (id: string) =>
  useQuery<AboutUsNode>({
    queryKey: [ABOUT_US_NODE, id],
    queryFn: () => fetchAboutUsNode(id),
    enabled: !!id,
  });
