// ================= UTIL =================

export const HOURS = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, '0')}:00`
  );
  
  export const formatCFA = (amount: number) =>
    `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
  
  export const addHours = (time: string, h: number) => {
    const [hh] = time.split(':').map(Number);
    return `${(hh + h).toString().padStart(2, '0')}:00`;
  };
  
  export const overlaps = (
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string
  ) => aStart < bEnd && aEnd > bStart;
  