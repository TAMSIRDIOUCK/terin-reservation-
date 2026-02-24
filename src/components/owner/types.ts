export interface Booking {
    id: string;
    terrain?: { name: string };
    client?: { full_name: string; phone: string };
    date: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'cancelled';
  }