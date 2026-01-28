// "use client";

// import React from "react";
// import { EmblaOptionsType } from "embla-carousel";
// import { DotButton, useDotButton } from "./embla-carousel-dot-button";
// import {
//   PrevButton,
//   NextButton,
//   usePrevNextButtons,
// } from "./embla-carousel-arrow-buttons";
// import useEmblaCarousel from "embla-carousel-react";
// import Image from "next/image";

// type PropType = {
//   images: { id: string; url: string; alt: string }[];
//   options?: EmblaOptionsType;
// };

// export const ArticleCarousel: React.FC<PropType> = ({ images, options }) => {
//   const [emblaRef, emblaApi] = useEmblaCarousel(options);

//   const { selectedIndex, scrollSnaps, onDotButtonClick } =
//     useDotButton(emblaApi);

//   const {
//     prevBtnDisabled,
//     nextBtnDisabled,
//     onPrevButtonClick,
//     onNextButtonClick,
//   } = usePrevNextButtons(emblaApi);

//   return (
//     <section className="embla">
//       <div className="embla__viewport" ref={emblaRef}>
//         <div className="embla__container gap-2">
//           {images.map((image) => (
//             <div className="embla__slide relative" key={image.id}>
//               <Image
//                 src={image.url || "/placeholder.svg"}
//                 alt={image.alt}
//                 fill
//                 className="object-cover rounded-xl"
//               />
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="embla__controls">
//         <div className="embla__buttons">
//           <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
//           <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
//         </div>

//         <div className="embla__dots">
//           {scrollSnaps.map((_, index) => (
//             <DotButton
//               key={index}
//               onClick={() => onDotButtonClick(index)}
//               className={`embla__dot ${
//                 index === selectedIndex ? "embla__dot--selected" : ""
//               }`}
//             />
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };
"use client";

import React, { useState } from "react";
import { EmblaOptionsType } from "embla-carousel";
import { DotButton, useDotButton } from "./embla-carousel-dot-button";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "./embla-carousel-arrow-buttons";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PropType = {
  images: { id: string; url: string; alt: string }[];
  options?: EmblaOptionsType;
};

export const ArticleCarousel: React.FC<PropType> = ({ images, options }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const handleImageClick = (image: { url: string; alt: string }) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container gap-2">
            {images.map((image) => (
              <div
                className="embla__slide relative cursor-pointer hover:opacity-90 transition-opacity"
                key={image.id}
                onClick={() => handleImageClick(image)}
              >
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="embla__controls">
          <div className="embla__buttons">
            <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
            <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
          </div>

          <div className="embla__dots">
            {scrollSnaps.map((_, index) => (
              <DotButton
                key={index}
                onClick={() => onDotButtonClick(index)}
                className={`embla__dot ${
                  index === selectedIndex ? "embla__dot--selected" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-4">
          <DialogHeader>
            <DialogTitle className="sr-only">Vista de imagen</DialogTitle>
            <DialogDescription className="sr-only">
              {selectedImage?.alt || "Imagen de la galería"}
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-[500px]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          {/* {selectedImage?.alt && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              {selectedImage.alt}
            </p>
          )} */}
        </DialogContent>
      </Dialog>
    </>
  );
}