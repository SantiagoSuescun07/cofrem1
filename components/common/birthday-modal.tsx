"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Send } from "lucide-react";
import Image from "next/image";
import { Birthday } from "@/services/birthday/get-birthdays";
import { toast } from "sonner";
import {
  uploadBirthdayImage,
  sendBirthdayCongratulations,
} from "@/services/birthday/send-congratulations";

interface BirthdayModalProps {
  birthday: Birthday | null;
  open: boolean;
  onClose: () => void;
}

export function BirthdayModal({ birthday, open, onClose }: BirthdayModalProps) {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!birthday) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Por favor, escribe un mensaje");
      return;
    }

    if (!birthday.uid) {
      toast.error("No se encontró el ID del usuario");
      return;
    }

    setIsSending(true);
    try {
      let imageId: number | undefined;

      // Si hay una imagen seleccionada, subirla primero
      if (selectedImage) {
        try {
          imageId = await uploadBirthdayImage(selectedImage);
        } catch (error) {
          console.error("Error al subir imagen:", error);
          toast.error("Error al subir la imagen. Intenta nuevamente.");
          setIsSending(false);
          return;
        }
      }

      // Enviar la felicitación
      await sendBirthdayCongratulations({
        user_id: parseInt(birthday.uid, 10),
        message: message.trim(),
        image_id: imageId,
      });

      toast.success("¡Mensaje enviado exitosamente!");
      setMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error("Error al enviar el mensaje. Intenta nuevamente.");
    } finally {
      setIsSending(false);
    }
  };

  const displayName = birthday.field_full_name?.trim() || birthday.name;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            🎉 ¡Feliz Cumpleaños!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Foto y nombre del cumpleañero */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {birthday.profileImage ? (
                <Image
                  src={birthday.profileImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl ">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {displayName}
              </h3>
              {birthday.area && (
                <p className="text-sm text-gray-500">{birthday.area}</p>
              )}
            </div>
          </div>

          {/* Campo de mensaje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deja un mensaje de felicitación
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Adjuntar imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjuntar imagen (opcional)
            </label>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> o
                    arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG o GIF</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>
            ) : (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 bg-[#306393] hover:bg-[#306393]/90"
              disabled={isSending || !message.trim()}
            >
              {isSending ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

