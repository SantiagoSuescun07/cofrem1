import { useDirectoryByArea } from "@/queries/directory/use-directory";
import { ProfileCard } from "./profile-card";

export function DirectoryList({ areaId }: { areaId: number }) {
  const { data, isLoading } = useDirectoryByArea(areaId);

  if (isLoading)
    return (
      <div>
        <div className="text-gray-400 text-center mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm"
              >
                {/* Imagen simulada */}
                <div className="h-52 w-full bg-gray-200" />

                {/* Texto */}
                <div className="p-6 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  if (!data || data.length === 0)
    return (
      <p className="text-gray-400 text-center mt-6">
        No hay empleados en esta área
      </p>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((employee: any) => (
        <ProfileCard key={employee.id} {...employee} />
      ))}
    </div>
  );
}
