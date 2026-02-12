import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Trusted by teams at",
  logos = [],
}: Logos3Props) => {
  return (
    <section className="py-12 w-full">
      <div className="flex flex-col items-center text-center px-6">
        <h2 className="my-6 text-pretty text-sm font-medium text-muted-foreground opacity-60">
          {heading}
        </h2>
      </div>
      <div className="pt-2 w-full">
        <div className="relative flex items-center justify-center w-full">
          <Carousel
            opts={{ loop: true }}
            plugins={[AutoScroll({ playOnInit: true, speed: 0.7 })]}
          >
            <CarouselContent className="ml-0">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="basis-1/3 pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                >
                  <div className="flex shrink-0 items-center justify-center">
                    <div className="flex items-center">
                      <img
                        src={logo.image}
                        alt={logo.description}
                        className={logo.className || "h-7 w-auto"}
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
