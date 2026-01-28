"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

import {
  useDependencies,
  usePqrsTypes,
  useUrgencyLevels,
} from "@/queries/pqrs";
import { createPqrs, uploadFile } from "@/services/pqrs/create-pqrs";
import { useQueryClient } from "@tanstack/react-query";
import { PQRS_QUERY_KEY } from "@/constants/query-keys";

const formSchema = z.object({
  tipo: z.string().min(1, "Selecciona el tipo de PQR"),
  dependencia: z.string().min(1, "Selecciona la dependencia"),
  urgencia: z.string().min(1, "Selecciona el nivel de urgencia"),
  asunto: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
  descripcion: z
    .string()
    .min(20, "La descripción debe tener al menos 20 caracteres"),
  evidencia: z.any().optional(),
});

interface PQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PQRModal({ isOpen, onClose }: PQRModalProps) {
  const queryClient = useQueryClient();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: tipos } = usePqrsTypes();
  const { data: dependencias } = useDependencies();
  const { data: urgencias } = useUrgencyLevels();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: "",
      dependencia: "",
      urgencia: "",
      asunto: "",
      descripcion: "",
    },
  });

  // Maneja múltiples archivos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Agregar los nuevos archivos a la lista existente
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
      // Limpiar el input para permitir seleccionar los mismos archivos nuevamente
      event.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setUploading(true);
      const fileIds: number[] = [];

      // 🔁 Subir cada archivo binario
      for (const file of selectedFiles) {
        const response = await uploadFile(file);
        const fid = response?.fid?.[0]?.value;
        if (fid) fileIds.push(fid);
      }

      // 📦 Crear payload con todos los FIDs
      const payload = {
        field_pqrs_type: Number(values.tipo),
        field_subject: values.asunto,
        field_description: values.descripcion,
        field_dependencies: Number(values.dependencia),
        field_urgency_level: Number(values.urgencia),
        field_file_new: fileIds, // ✅ [33, 34, ...]
      };

      await createPqrs(payload);
      await queryClient.invalidateQueries({ queryKey: [PQRS_QUERY_KEY] });

      toast.success("PQR creada exitosamente", {
        description: "Tu solicitud ha sido registrada correctamente.",
      });

      form.reset();
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear la PQR");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Nueva PQR</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear una nueva Petición, Queja o
            Reclamo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo, dependencia, urgencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de PQR</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipos?.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dependencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dependencia</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una dependencia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dependencias?.map((d: any) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="urgencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de urgencia</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {urgencias?.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asunto */}
            <FormField
              control={form.control}
              name="asunto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Describe brevemente el asunto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe detalladamente tu petición, queja o reclamo"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Adjuntar archivos */}
            <FormField
              control={form.control}
              name="evidencia"
              render={() => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">
                    Adjuntar Evidencia - Opcional
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="evidencia"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-primary" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">
                                Haz clic para subir
                              </span>{" "}
                              o arrastra y suelta
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, PDF (MAX. 10MB)
                            </p>
                          </div>
                          <input
                            id="evidencia"
                            type="file"
                            className="hidden"
                            accept=".png,.jpg,.jpeg,.pdf"
                            multiple
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-accent rounded-lg border border-accent-foreground/20"
                            >
                              <div className="text-sm">
                                <p className="font-medium text-accent-foreground">
                                  {file.name}
                                </p>
                                <p className="text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    Puedes subir varios archivos; cada uno se cargará
                    automáticamente al enviar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-rose-400 text-rose-500 hover:bg-rose-400 hover:text-primary-foreground bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={uploading}
              >
                {uploading ? "Subiendo..." : "Crear PQR"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
