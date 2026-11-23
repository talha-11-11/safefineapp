// Message texts opened in the owner's own WhatsApp (free, no API). Safe for client components.
import { monthLabel, shortDate } from "./dates";
import { rs } from "./format";

/** Delivery message: date, bottles, cash paid now and the balance left. */
export function deliveryMessage(p: { date: string; bottles: number; paid: number; balance: number; business: string }): string {
  const lines = [p.business, `${shortDate(p.date)}: ${p.bottles} bottle (19L) deliver huay.`];
  if (p.paid > 0) lines.push(`Wasool: ${rs(p.paid)}`);
  lines.push(p.balance > 0 ? `Baqaya: ${rs(p.balance)}` : p.balance < 0 ? `Advance: ${rs(-p.balance)}` : "Hisaab clear.");
  lines.push("Shukriya!");
  return lines.join("\n");
}

type PaySettings = {
  jazzcashNumber: string; jazzcashTitle: string; easypaisaNumber: string; easypaisaTitle: string; paymentInfo: string;
};

/** Payment accounts as short lines, e.g. "JazzCash: 0300-1234567 (Account name)". */
export function paymentLines(s: PaySettings): string[] {
  const lines: string[] = [];
  if (s.jazzcashNumber) lines.push(`JazzCash: ${s.jazzcashNumber}${s.jazzcashTitle ? ` (${s.jazzcashTitle})` : ""}`);
  if (s.easypaisaNumber) lines.push(`Easypaisa: ${s.easypaisaNumber}${s.easypaisaTitle ? ` (${s.easypaisaTitle})` : ""}`);
  if (s.paymentInfo) lines.push(s.paymentInfo);
  return lines;
}

export function billMessage(p: {
  name: string; month: string; std: number; disp: number; charges: number; previousBalance: number;
  paid: number; totalDue: number; pay: string[]; business: string; link: string;
}): string {
  const cans = p.disp ? `${p.std} standard + ${p.disp} dispenser` : `${p.std} bottle (19L)`;
  return [
    `Assalam o Alaikum ${p.name}!`,
    `${monthLabel(p.month)} ka bill:`,
    `${cans} = ${rs(p.charges)}`,
    ...(p.previousBalance ? [`Pichla baqaya: ${rs(p.previousBalance)}`] : []),
    ...(p.paid ? [`Jama (paid): ${rs(p.paid)}`] : []),
    `Total due: ${rs(Math.max(p.totalDue, 0))}`,
    ...(p.pay.length ? ["", ...p.pay, "ya delivery par cash dein."] : []),
    `Bill: ${p.link}`,
    `Shukriya, ${p.business}`,
  ].join("\n");
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
