"use client";
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { DirectoryList } from "@/components/directory/directory-list";

export const DirectoryTabsContent = ({ areas }: { areas: any[] }) => {
  return (
    <>
      {areas.map((area) => (
        <TabsContent key={area.id} value={String(area.id)}>
          <DirectoryList areaId={Number(area.id)} />
        </TabsContent>
      ))}
      {areas.flatMap((a) =>
        a.children.map((child:any) => (
          <TabsContent key={child.id} value={String(child.id)}>
            <DirectoryList areaId={Number(child.id)} />
          </TabsContent>
        ))
      )}
    </>
  );
};
