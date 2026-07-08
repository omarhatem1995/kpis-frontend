export interface KpiItem {
  key: string;
  label: string;
  weight: number;
  score: number;
  tooltip: string;
}

export interface KpiSection {
  key: string;
  title: string;
  totalWeight: number;
  totalScore: number;
  items: KpiItem[];
}

export interface KpiReport {
  userId: number;
  memberName: string;
  team: string | null;
  module: string | null;
  period: string;
  startDate: string;
  endDate: string;
  totalScore: number;
  avgRating: number | null;
  daysLogged: number;
  sections: KpiSection[];
}
