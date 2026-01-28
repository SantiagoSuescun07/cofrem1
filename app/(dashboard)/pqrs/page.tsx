"use client";

import React, { useState } from "react";
import { PQRModal } from "./_components/pqr-modal";
import { PQRHeader } from "./_components/pqr-header";
import { StatsCards } from "./_components/stats-cards";
import { PQRList } from "./_components/pqr-list";

export default function PqrsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative">
      <div className="container mx-auto py-6 px-6 md:px-10">
        {/* Header */}
        <PQRHeader setIsModalOpen={setIsModalOpen} />

        {/* Stats Cards */}
        <StatsCards />

        {/* PQRs List */}
        <PQRList />

        {/* Modal */}
        <PQRModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}
