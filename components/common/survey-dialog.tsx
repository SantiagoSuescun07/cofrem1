"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  usePollQuery,
  useVoteMutation,
  type Poll,
} from "@/queries/encuentas/usepoll-query";

interface SurveyDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SurveyDialog: React.FC<SurveyDialogProps> = ({
  open,
  onClose,
}) => {
  const { data: polls, isLoading, isError } = usePollQuery();
  const { mutate: vote, isPending } = useVoteMutation();
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [processingPollId, setProcessingPollId] = useState<string | number | null>(null);

  const pollsArray: Poll[] = Array.isArray(polls) ? polls : [];

  const handleVote = (pollId: string | number) => {
    const choiceId = selectedChoices[String(pollId)];
    if (!choiceId) return;
    setProcessingPollId(pollId);
    vote(
      { pollId, choiceId },
      {
        onSuccess: () => {
          setSelectedChoices((prev) => {
            const next = { ...prev };
            delete next[String(pollId)];
            return next;
          });
          setProcessingPollId(null);
        },
        onError: () => {
          setProcessingPollId(null);
        },
      }
    );
  };

  const handleCancelVote = (pollId: string | number) => {
    setProcessingPollId(pollId);
    vote(
      { pollId, cancel: true },
      {
        onSuccess: () => {
          setProcessingPollId(null);
        },
        onError: () => {
          setProcessingPollId(null);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-medium">Encuestas Activas</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading && (
            <p className="text-sm text-gray-500 py-4">Cargando encuestas...</p>
          )}
          {isError && (
            <p className="text-sm text-red-500 py-4">Error al cargar las encuestas.</p>
          )}

          {!isLoading && !isError && pollsArray.length === 0 && (
            <div className="py-4">
              <p className="text-sm text-gray-600 text-center">
                No hay encuestas activas en este momento.
              </p>
            </div>
          )}

          {!isLoading && !isError && pollsArray.length > 0 && (
            <div className="space-y-6">
              {pollsArray.map((poll) => {
                const pollId = poll.id;
                const pollIdString = String(pollId);
                const hasVoted = poll.has_user_voted;
                // Permitir cancelar si allow_cancel es "1" o cualquier valor truthy
                const allowCancelValue = String(poll.allow_cancel);
                const allowCancel = allowCancelValue === "1" || allowCancelValue === "true";
                const showResultsValue = String(poll.allow_view_results);
                const showResults = poll.results && (showResultsValue === "1" || showResultsValue === "true");
                const selectedChoice = selectedChoices[pollIdString];
                const canVote = !hasVoted && selectedChoice;
                const isProcessing = processingPollId === pollId;

                return (
                  <div
                    key={pollId}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-gray-700 font-medium text-base">
                        {poll.fields?.field_title?.[0]?.value || poll.question || "Encuesta sin título"}
                      </p>
                      {hasVoted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                          Ya respondiste
                        </span>
                      )}
                    </div>

                    {Array.isArray(poll.options) &&
                      poll.options.map((option) => {
                        const result = poll.results?.choices?.find(
                          (choice) => choice.id === option.id
                        );
                        const votes = result ? Number(result.votes) : 0;
                        const percentage = result ? Number(result.percentage) : 0;

                        return (
                          <label
                            key={option.id}
                            className={`flex flex-col p-3 rounded-lg transition-colors ${
                              hasVoted
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer hover:bg-[#e4fef1]"
                            } ${
                              selectedChoice === String(option.id)
                                ? "bg-[#e4fef1]"
                                : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name={`choice-${pollId}`}
                                value={option.id}
                                checked={selectedChoice === String(option.id)}
                                onChange={() =>
                                  !hasVoted &&
                                  setSelectedChoices((prev) => ({
                                    ...prev,
                                    [pollIdString]: String(option.id),
                                  }))
                                }
                                disabled={hasVoted}
                                className="w-4 h-4 text-[#2deb79] border-gray-300 focus:ring-[#2deb79] focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                                style={{
                                  accentColor: "#2deb79",
                                }}
                              />
                              <span className="font-medium text-gray-700 flex-1">
                                {option.label}
                              </span>
                              {showResults && (
                                <span className="text-sm font-semibold text-gray-600">
                                  {votes} {votes === 1 ? "voto" : "votos"} ({percentage}%)
                                </span>
                              )}
                            </div>

                            {/* Barra de progreso */}
                            {showResults && (
                              <div className="mt-2 ml-7">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-[#2deb79] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </label>
                        );
                      })}

                    {/* Botones de acción para cada encuesta */}
                    <div className="flex items-center gap-2 pt-2">
                      {!hasVoted ? (
                        <Button
                          onClick={() => handleVote(pollId)}
                          disabled={!canVote || isProcessing}
                          className="bg-[#2deb79] hover:bg-[#2deb79]/90 text-sm"
                          size="sm"
                        >
                          {isProcessing ? "Enviando..." : "Enviar respuesta"}
                        </Button>
                      ) : allowCancel ? (
                        <Button
                          onClick={() => handleCancelVote(pollId)}
                          disabled={isProcessing}
                          variant="outline"
                          className="text-sm border-red-300 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          {isProcessing ? "Cancelando..." : "Cancelar voto"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
