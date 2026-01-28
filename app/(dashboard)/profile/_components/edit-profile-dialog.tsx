import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTaxonomyTerms } from "@/services/taxonomies";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const editProfileSchema = z.object({
  fullName: z.string().min(1, "El nombre es requerido").optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  profileImage: z.any().optional(),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export interface EditProfileDialogProps {
  trigger: React.ReactNode;
  userId: string;
  defaultValues?: {
    fullName?: string;
    birthdate?: string;
    gender?: string;
    profileImageUrl?: string;
  };
  onClose?: () => void;
  onSuccess?: () => void;
  className?: string
}

export function EditProfileDialog({
  trigger,
  userId,
  defaultValues,
  onClose,
  onSuccess,
  className
}: EditProfileDialogProps) {
  const { data: genders } = useQuery({
    queryKey: ["taxonomy", "gender"],
    queryFn: () => fetchTaxonomyTerms("/jsonapi/taxonomy_term/gender"),
  });

  const queryClient = useQueryClient();

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      birthdate: defaultValues?.birthdate ?? "",
      gender: defaultValues?.gender ?? "",
      profileImage: undefined,
    },
  });

  const { isSubmitting } = form.formState

  const [profileImageUrl, setProfileImageUrl] = React.useState<string>(
    defaultValues?.profileImageUrl || ""
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImageUrl(url);
      form.setValue("profileImage", file);
    }

    e.target.value = "";
  };


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        fullName: defaultValues.fullName ?? "",
        birthdate: defaultValues.birthdate ?? "",
        gender: defaultValues.gender ?? "",
        profileImage: undefined,
      });

      setProfileImageUrl(defaultValues.profileImageUrl || "");
    }
  }, [defaultValues, form]);


  const onSubmit = async (values: EditProfileFormValues) => {
    try {
      let payload: Record<string, any> = {};

      if (values.fullName) {
        payload.field_full_name = [{ value: values.fullName }];
      }

      if (values.birthdate) {
        payload.field_birthdate = [{ value: values.birthdate }];
      }

      if (values.gender) {
        payload.field_gender = [
          {
            target_id: Number(values.gender),
          },
        ];
      }

      if (values.profileImage instanceof File) {
        const file = values.profileImage;
        // Convertir el archivo a binary data
        const arrayBuffer = await file.arrayBuffer();
        const binaryData = new Uint8Array(arrayBuffer);

        // Subir la imagen a Drupal para obtener el fid
        const uploadResponse = await api.post(
          `/file/upload/media/image/field_media_image`,
          binaryData,
          {
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `file; filename="${file.name}"`,
              Accept: "application/json",
            },
          }
        );

        console.log("UPLOAD RESPONSE: ", uploadResponse)

        // Drupal devuelve el ID dentro de fid[0].value
        const fileId = uploadResponse.data?.fid?.[0]?.value;

        if (fileId) {
          payload.user_picture = [
            {
              target_id: fileId,
            },
          ];
        }
      }

      console.log("Payload: ", payload)

      // Si el payload no contiene cambios, no hacemos el PATCH.
      if (Object.keys(payload).length > 0) {
        const res = await api.patch(`/user/${userId}?_format=json`, payload);
        if (res.status === 200) {
          // Invalida la cache del perfil
          await queryClient.invalidateQueries({
            queryKey: ["user-profile", userId]
          });

          onSuccess?.();
        }
      }
    } catch (error) {
      toast.error("Error al actualizar el perfil");
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      {/* Utilizar el trigger pasado como prop para abrir el diálogo */}
      <DialogTrigger asChild className={cn(className)}>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-normal">Editar perfil</DialogTitle>
          <DialogDescription>
            Modifica tu nombre, cumpleaños, género y foto de perfil.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Sección de la foto de perfil */}
            <div className="flex flex-col items-center space-y-4 bg-muted rounded-2xl py-4">
              <div className="relative group">
                <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl transition-all group-hover:ring-primary/20">
                  <AvatarImage
                    src={profileImageUrl || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-2xl font-semibold">
                    <Camera className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>

                {/* Botón de cámara flotante */}
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center border-4 border-background"
                >
                  <Camera className="h-5 w-5" />
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                JPG, GIF o PNG · Máx 1 MB
              </p>
            </div>


            <div className="bg-neutral-100 rounded-2xl py-4 border px-4 space-y-6">
              {/* Campo de nombre completo */}
              <Controller
                name="fullName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Tu nombre completo"
                        aria-invalid={fieldState.invalid}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de cumpleaños */}
              <Controller
                name="birthdate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={field.value ?? ""}
                        aria-invalid={fieldState.invalid}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector de género */}
              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Género</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="min-w-full w-full bg-white" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Selecciona tu género" />
                        </SelectTrigger>
                        <SelectContent>
                          {genders?.map((gender) => (
                            <SelectItem key={gender.id} value={String(gender.tid)}>
                              {gender.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="border-t pt-4">
              {/* <Button type="button" variant="outline" className="flex-1">Cancelar</Button> */}
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-5 animate-spin" />}
                Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}