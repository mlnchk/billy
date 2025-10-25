import { evalite } from "evalite";
import { readFileSync } from "fs";
import { JSONDiff } from "autoevals";

import { createAiService, type Bill } from "../worker/services/ai";

const aiService = createAiService(process.env.GOOGLEAI_API_KEY!);

evalite("My Eval", {
  data: [
    {
      input: readFileSync(new URL("./assets/bill-1.jpeg", import.meta.url)),
      expected: {
        items: [
          {
            nameOriginal: "Asahi Beer Large",
            nameEnglish: "Asahi Beer Large",
            quantity: 2,
            priceTotalt: null,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Tataki Kyuri Ume",
            nameEnglish: "Tataki Kyuri Ume",
            quantity: 1,
            priceTotal: 99,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Kari Salad",
            nameEnglish: "Kari Salad",
            quantity: 1,
            priceTotal: 180,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Potato salad",
            nameEnglish: "Potato salad",
            quantity: 1,
            priceTotal: 139,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Topping Kimchi",
            nameEnglish: "Topping Kimchi",
            quantity: 1,
            priceTotal: 30,
            pricePerUnit: null,
          },
          {
            nameOriginal: "- Topping Shiokara",
            nameEnglish: "- Topping Shiokara",
            quantity: 1,
            priceTotal: 60,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Mame-Aji",
            nameEnglish: "Mame-Aji",
            quantity: 1,
            priceTotal: 155,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Teba-Naka",
            nameEnglish: "Teba-Naka",
            quantity: 1,
            priceTotal: 175,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Potato mentai cheese",
            nameEnglish: "Potato mentai cheese",
            quantity: 1,
            priceTotal: 175,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Ika Sumibi-Yaki",
            nameEnglish: "Ika Sumibi-Yaki",
            quantity: 1,
            priceTotal: 220,
            pricePerUnit: null,
          },
          {
            nameOriginal: "Asahi Beer",
            nameEnglish: "Asahi Beer",
            quantity: 4,
            priceTotal: 480,
            pricePerUnit: null,
          },
        ],
        subtotal: 2133,
        total: 2511,
        currency: "THB",
        vat: 164.24,
        serviceFee: 213.3,
        totalDiscount: null,
      } as Bill,
    },
  ],
  task: async (input) => {
    return aiService.analyzeBillImage(input);
  },
  scorers: [JSONDiff],
});
