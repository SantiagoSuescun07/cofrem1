import React from "react";

type CategoryType = "RRHH" | "Bienestar" | "Formación";
type BadgeSize = "sm" | "md";

interface CategoryBadgeProps {
  category: CategoryType;
  size?: BadgeSize;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = "sm",
}) => {
  const getCategoryStyles = (category: CategoryType): string => {
    switch (category) {
      case "RRHH":
        return "bg-blue-100 text-blue-700";
      case "Bienestar":
        return "bg-green-100 text-green-700";
      case "Formación":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const sizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`font-medium rounded-full ${getCategoryStyles(
        category
      )} ${sizeClass}`}
    >
      {category}
    </span>
  );
};
