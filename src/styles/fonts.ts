import localFont from "next/font/local";
import { Baloo_2, Lora } from "next/font/google";

const zahra = localFont({
  src: "../../public/font/zahra/Zahra.ttf",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-zahra",
  fallback: ["Times New Roman", "serif"],
  adjustFontFallback: false,
});

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  style: "normal",
  display: "swap",
  variable: "--font-lora",
});

const baloo2 = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  style: "normal",
  display: "swap",
  variable: "--font-game",
});

export { baloo2, lora, zahra };
