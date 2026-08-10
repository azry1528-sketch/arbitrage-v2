import { faqData } from "./data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Faq = () => {
  return (
    <section id="faq" className="py-16 text-white">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-[#6bd672] uppercase text-sm">Questions fréquentes</p>
            <h2 className="text-3xl md:text-4xl font-semibold mt-2">En savoir plus sur ArbiFlow</h2>
            <p className="text-white/40 mt-2">Nous prenons en charge de nombreuses cryptomonnaies dans le monde entier</p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white/5 rounded-lg border-none px-4"
              >
                <AccordionTrigger className="text-lg font-medium hover:no-underline py-4 text-white [&>svg]:text-[#6bd672]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/50 text-base">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Faq;
