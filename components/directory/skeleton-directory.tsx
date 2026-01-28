"use client";
import React from "react";

export const DirectorySkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 animate-pulse">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
        <div className="flex items-center justify-center h-[74px] border-b border-gray-100">
          <div className="h-6 w-32 bg-gray-200 rounded" />
        </div>

        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-5/6 bg-gray-200 rounded" />
          ))}
        </div>
      </aside>

      {/* Main skeleton */}
      <main className="flex-1 flex flex-col p-6">
        {/* Header fake */}
        <div className="h-10 w-1/2 bg-gray-200 rounded mb-6" />
        <div className="flex flex-col space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-24 w-full bg-gray-200 rounded-lg border border-gray-100"
            />
          ))}
        </div>
      </main>
    </div>
  );
};
