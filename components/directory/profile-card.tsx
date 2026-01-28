import { Card, CardContent } from "@/components/ui/card";
import { Building2, User, Phone, Mail, BookUser } from "lucide-react";
import Image from "next/image";

interface ProfileCardProps {
  name: string;
  position: string;
  division: string;
  jobTitle: string;
  phone: string;
  email: string;
  imageUrl: string;
  area?: string;
}

export function ProfileCard({
  name,
  position,
  phone,
  area,
  email,
  imageUrl,
}: ProfileCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow py-0 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] mx-auto">
      <div className="relative w-full h-[250px]  sm:h-[300px] md:h-[350px] lg:h-[400px] bg-gray-100 flex items-center justify-center overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain"
          style={{ objectFit: "contain" }}
        />
      </div>
      <CardContent className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-medium text-foreground">{name}</h3>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start gap-2 sm:gap-3">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">{area}</p>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <BookUser className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {position}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <p className="text-xs sm:text-sm text-foreground">{phone}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <p className="text-xs sm:text-sm text-foreground break-all">{email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
