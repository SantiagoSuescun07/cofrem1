// import React from 'react';
// import Image from 'next/image';

// // Componente para el mosaico de imágenes simétrico
// const SymmetricImageGrid = ({ images, onImageClick }) => {
//   const imageCount = images.length;

//   // Función para obtener el layout según el número de imágenes
//   const getGridLayout = () => {
//     switch (imageCount) {
//       case 1:
//         return {
//           gridClass: 'grid-cols-1',
//           items: [{ span: 'col-span-1', height: 'h-[500px]' }]
//         };
//       case 2:
//         return {
//           gridClass: 'grid-cols-2',
//           items: [
//             { span: 'col-span-1', height: 'h-[400px]' },
//             { span: 'col-span-1', height: 'h-[400px]' }
//           ]
//         };
//       case 3:
//         return {
//           gridClass: 'grid-cols-2',
//           items: [
//             { span: 'col-span-2', height: 'h-[300px]' },
//             { span: 'col-span-1', height: 'h-[250px]' },
//             { span: 'col-span-1', height: 'h-[250px]' }
//           ]
//         };
//       case 4:
//         return {
//           gridClass: 'grid-cols-2',
//           items: [
//             { span: 'col-span-1', height: 'h-[300px]' },
//             { span: 'col-span-1', height: 'h-[300px]' },
//             { span: 'col-span-1', height: 'h-[300px]' },
//             { span: 'col-span-1', height: 'h-[300px]' }
//           ]
//         };
//       case 5:
//         return {
//           gridClass: 'grid-cols-3',
//           items: [
//             { span: 'col-span-2 row-span-2', height: 'h-full' },
//             { span: 'col-span-1', height: 'h-[200px]' },
//             { span: 'col-span-1', height: 'h-[200px]' },
//             { span: 'col-span-1', height: 'h-[200px]' },
//             { span: 'col-span-1', height: 'h-[200px]' }
//           ]
//         };
//       default: // 6 o más
//         return {
//           gridClass: 'grid-cols-3',
//           items: Array(Math.min(6, imageCount)).fill({ span: 'col-span-1', height: 'h-[250px]' })
//         };
//     }
//   };

//   const layout = getGridLayout();
//   const displayImages = images.slice(0, 6);
//   const remainingCount = imageCount > 6 ? imageCount - 6 : 0;

//   return (
//     <div className="w-full overflow-hidden rounded-xl">
//       <div className={`grid ${layout.gridClass} gap-1`}>
//         {displayImages.map((img, index) => {
//           const itemLayout = layout.items[index] || layout.items[0];
//           const isLast = index === 5 && remainingCount > 0;

//           return (
//             <div
//               key={img.id || index}
//               onClick={() => onImageClick(index)}
//               className={`relative cursor-pointer overflow-hidden bg-gray-200 group ${itemLayout.span} ${itemLayout.height}`}
//             >
//               <Image
//                 src={img.url}
//                 alt={img.alt || `Imagen ${index + 1}`}
//                 fill
//                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                 className="object-cover transition-transform duration-300 group-hover:scale-105"
//               />
//               {isLast && (
//                 <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
//                   <span className="text-white text-4xl font-bold">
//                     +{remainingCount}
//                   </span>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// // Ejemplo de uso
// export default function PublicationExample() {
//   const sampleImages = [
//     { id: '1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', alt: 'Mountain' },
//     { id: '2', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', alt: 'Nature' },
//     { id: '3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05', alt: 'Fog' },
//     { id: '4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', alt: 'Forest' },
//     { id: '5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e', alt: 'Valley' }
//   ];

//   const [selectedIndex, setSelectedIndex] = React.useState(null);

//   return (
//     <div className="max-w-4xl mx-auto p-6 space-y-6">
//       <h1 className="text-2xl font-bold text-gray-900">
//         Ejemplo de Publicación
//       </h1>
      
//       {/* Descripción de la publicación */}
//       <div className="prose prose-sm md:prose-base max-w-none">
//         <p className="text-gray-700 leading-relaxed">
//           Esta es la descripción de la publicación que se renderiza antes de las imágenes.
//           Puede contener HTML y se mostrará de manera elegante.
//         </p>
//       </div>

//       {/* Mosaico de imágenes */}
//       <SymmetricImageGrid 
//         images={sampleImages}
//         onImageClick={(index) => setSelectedIndex(index)}
//       />

//       {selectedIndex !== null && (
//         <p className="text-sm text-gray-600 mt-4">
//           Imagen seleccionada: {selectedIndex + 1}
//         </p>
//       )}
//     </div>
//   );
// }